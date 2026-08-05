import { Router } from 'express';
import { UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { badRequest, conflict, forbidden, unauthorized } from '../lib/errors';
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from '../lib/password';
import { generateRefreshToken, hashToken, passwordResetExpiry } from '../lib/tokens';
import { REFRESH_COOKIE, clearAuthCookies } from '../lib/cookies';
import { sendMail } from '../lib/mailer';
import { getFeatureToggles } from '../lib/settings';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { requireCsrf } from '../middleware/csrf';
import { loginLimiter, passwordResetLimiter, registerLimiter } from '../middleware/rateLimit';
import { issueSession, revokeAllSessions, revokeSession, rotateSession } from '../services/session';

/**
 * Auth endpoints — `references/admin.md` A1.
 *
 * Two credentials with different jobs: a short-lived bearer access token the
 * client holds in memory, and a long-lived httpOnly refresh cookie it cannot
 * read. The cookie is what survives a page reload; the access token is what
 * every guarded route actually checks.
 */
export const authRouter = Router();

const emailSchema = z.string().email().max(254).toLowerCase().trim();
const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(200);

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1, 'Name is required').max(120),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(200),
});

const forgotSchema = z.object({ email: emailSchema });

const resetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(200),
  newPassword: passwordSchema,
});

/* --------------------------------- register --------------------------------- */

authRouter.post(
  '/auth/register',
  registerLimiter,
  validateBody(registerSchema),
  async (req, res) => {
    const { email, password, name } = req.body as z.infer<typeof registerSchema>;

    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Invite-only never blocks the very first account, or the instance could not
    // be bootstrapped once the flag is on.
    if (!isFirstUser) {
      const { registrationInviteOnly } = await getFeatureToggles();
      if (registrationInviteOnly) {
        throw forbidden(
          'Registration is invite-only. Ask an administrator to create your account.',
        );
      }
    }

    if (await prisma.user.findUnique({ where: { email } })) {
      throw conflict('An account with this email already exists');
    }

    const superAdminRole = isFirstUser
      ? await prisma.role.findUnique({ where: { key: 'super_admin' } })
      : null;

    if (isFirstUser && !superAdminRole) {
      throw badRequest('Roles have not been seeded. Run `npm run db:seed` before registering.');
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(password),
        // First user runs the place; everyone else waits for an admin to approve
        // them and assign a role (hence no roleId).
        status: isFirstUser ? UserStatus.ACTIVE : UserStatus.PENDING,
        roleId: superAdminRole?.id ?? null,
      },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.register',
        resource: 'users',
        resourceId: user.id,
        dataJson: { firstUser: isFirstUser, status: user.status },
      },
    });

    if (!isFirstUser) {
      res.status(202).json({
        status: 'pending',
        message: 'Your account was created and is awaiting approval by an administrator.',
      });
      return;
    }

    const session = await issueSession(user, req, res);
    res.status(201).json({
      status: 'active',
      user: publicUser(user),
      ...session,
    });
  },
);

/* ----------------------------------- login ---------------------------------- */

authRouter.post('/auth/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

  // Same rejection whether the address is unknown or the password is wrong —
  // otherwise this endpoint enumerates which emails have accounts.
  const invalid = unauthorized('Invalid email or password');
  if (!user) {
    // Spend roughly the time a real comparison would, so response timing does
    // not distinguish "no such user" from "wrong password".
    await verifyPassword(password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
    throw invalid;
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    throw forbidden(`Account temporarily locked. Try again in ${minutes} minute(s).`);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= env.LOGIN_MAX_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + env.LOGIN_LOCKOUT_MINUTES * 60_000)
          : undefined,
      },
    });
    if (shouldLock) {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'auth.lockout',
          resource: 'users',
          resourceId: user.id,
          dataJson: { attempts, minutes: env.LOGIN_LOCKOUT_MINUTES },
        },
      });
      throw forbidden(
        `Account locked after ${env.LOGIN_MAX_ATTEMPTS} failed attempts. Try again in ${env.LOGIN_LOCKOUT_MINUTES} minutes.`,
      );
    }
    throw invalid;
  }

  // Status is checked only after the password is verified, so the error message
  // cannot be used to discover which addresses are registered-but-pending.
  if (user.status === UserStatus.PENDING) {
    throw forbidden('Your account is awaiting approval by an administrator');
  }
  if (user.status === UserStatus.DISABLED) {
    throw forbidden('Your account has been disabled');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const session = await issueSession(user, req, res);
  res.json({ user: publicUser(user), ...session });
});

/* ---------------------------------- refresh --------------------------------- */

authRouter.post('/auth/refresh', requireCsrf, async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw unauthorized('No refresh token');
  res.json(await rotateSession(token, req, res));
});

/* ---------------------------------- logout ---------------------------------- */

authRouter.post('/auth/logout', requireCsrf, async (req, res) => {
  await revokeSession(req.cookies?.[REFRESH_COOKIE] as string | undefined, res);
  res.status(204).end();
});

/* ------------------------------ password reset ------------------------------ */

authRouter.post(
  '/auth/forgot',
  passwordResetLimiter,
  validateBody(forgotSchema),
  async (req, res) => {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always the same response: whether an address has an account is not public.
    if (user && user.status !== UserStatus.DISABLED) {
      const token = generateRefreshToken();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: passwordResetExpiry() },
      });

      const link = `${env.APP_URL}/reset-password?token=${token}`;
      await sendMail({
        to: user.email,
        subject: 'Reset your AutoRoom password',
        text:
          `Hello ${user.name},\n\n` +
          `Use the link below to set a new password. It expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes ` +
          `and can be used once.\n\n${link}\n\n` +
          `If you did not request this, you can ignore this email.`,
      });
    }

    res.status(202).json({
      message: 'If an account exists for that address, a reset link has been sent.',
    });
  },
);

authRouter.post(
  '/auth/reset',
  passwordResetLimiter,
  validateBody(resetSchema),
  async (req, res) => {
    const { token, password } = req.body as z.infer<typeof resetSchema>;

    const stored = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!stored || stored.usedAt || stored.expiresAt.getTime() <= Date.now()) {
      throw badRequest('This reset link is invalid or has expired');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: stored.userId },
        data: {
          passwordHash: await hashPassword(password),
          // A successful reset also clears a lockout — it is the documented way
          // back in for someone who locked themselves out.
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
      // Any other outstanding link for this user stops working too.
      prisma.passwordResetToken.updateMany({
        where: { userId: stored.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          actorId: stored.userId,
          action: 'auth.password_reset',
          resource: 'users',
          resourceId: stored.userId,
        },
      }),
    ]);

    // The password changed, so every existing session is now suspect.
    await revokeAllSessions(stored.userId);
    clearAuthCookies(res);

    res.json({ message: 'Password updated. Sign in with your new password.' });
  },
);

/* ------------------------------ change password ------------------------------ */

/**
 * Self-service change for a signed-in user — most visibly the forced step
 * after a system-issued (partner invite) password, but not restricted to
 * that: `mustChangePassword` merely stops being true afterwards.
 *
 * Requires the current password despite the request already being
 * authenticated: a bearer token alone (e.g. from a stolen access token) should
 * not be enough to lock the real owner out by rotating their credential.
 */
authRouter.post(
  '/auth/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  async (req, res) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;

    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw unauthorized('Current password is incorrect');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.password_change',
        resource: 'users',
        resourceId: user.id,
      },
    });

    res.json({ message: 'Password updated.' });
  },
);

/* ------------------------------------ me ------------------------------------ */

authRouter.get('/auth/me', requireAuth, (req, res) => {
  res.json(req.auth);
});

/* ---------------------------------- helpers --------------------------------- */

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  role: { key: string; name: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    role: user.role ? { key: user.role.key, name: user.role.name } : null,
  };
}
