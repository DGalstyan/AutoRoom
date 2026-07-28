import { Router } from 'express';
import { UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import { MIN_PASSWORD_LENGTH, hashPassword } from '../lib/password';
import { requireAuth } from '../middleware/auth';
import { can, requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import { revokeAllSessions } from '../services/session';

/**
 * User administration — creating accounts, approving self-registered ones,
 * assigning roles (`references/admin.md` A2).
 *
 * Creation lives here rather than at `/auth/register` because the panel has no
 * public sign-up: an administrator enters the person's details and hands them a
 * password out of band. `/auth/register` still exists for bootstrapping the
 * very first super_admin on an empty database.
 */
export const usersRouter = Router();

/**
 * Roles that grant administrative reach. Assigning one is effectively handing
 * over the keys, so it needs `roles:UPDATE` (super_admin) rather than plain
 * `users:UPDATE` — otherwise an `admin`, who may "manage managers/editors",
 * could promote an account to super_admin and escalate past their own ceiling.
 */
const PRIVILEGED_ROLE_KEYS = new Set(['super_admin', 'admin']);

const listQuerySchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

const approveSchema = z.object({
  roleKey: z.string().min(1, 'roleKey is required'),
});

const assignRoleSchema = z.object({
  roleKey: z.string().min(1, 'roleKey is required'),
});

const statusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

const emailSchema = z.string().email().max(254).toLowerCase().trim();
const nameSchema = z.string().trim().min(1, 'Name is required').max(120);
const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(200);

const createSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  roleKey: z.string().min(1, 'roleKey is required'),
});

const updateSchema = z
  .object({
    email: emailSchema.optional(),
    name: nameSchema.optional(),
  })
  .refine((body) => body.email !== undefined || body.name !== undefined, {
    message: 'Provide at least one field to update',
  });

const passwordBodySchema = z.object({ password: passwordSchema });

usersRouter.get(
  '/users',
  requireAuth,
  requirePermission('users', 'READ'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const { status, take, skip } = req.query as unknown as z.infer<typeof listQuerySchema>;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where: status ? { status } : undefined,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.user.count({ where: status ? { status } : undefined }),
    ]);

    res.json({
      items: items.map(serializeUser),
      total,
      take,
      skip,
    });
  },
);

/**
 * Create an account outright — active, with a role, ready to sign in. The
 * password is set by the administrator and delivered out of band; there is no
 * invite email, so nothing here depends on SMTP being configured.
 */
usersRouter.post(
  '/users',
  requireAuth,
  requirePermission('users', 'CREATE'),
  validateBody(createSchema),
  async (req, res) => {
    const { email, name, password, roleKey } = req.body as z.infer<typeof createSchema>;

    if (await prisma.user.findUnique({ where: { email } })) {
      throw conflict('An account with this email already exists');
    }

    const role = await requireAssignableRole(roleKey, req.auth);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(password),
        status: UserStatus.ACTIVE,
        roleId: role.id,
      },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.userId,
        action: 'user.create',
        resource: 'users',
        resourceId: user.id,
        dataJson: { email: user.email, roleKey: role.key },
      },
    });

    res.status(201).json(serializeUser(user));
  },
);

/** Approve a pending registration and give it a role in one step. */
usersRouter.post(
  '/users/:id/approve',
  requireAuth,
  requirePermission('users', 'UPDATE'),
  validateBody(approveSchema),
  async (req, res) => {
    const { roleKey } = req.body as z.infer<typeof approveSchema>;

    const user = await prisma.user.findUnique({ where: { id: String(req.params.id ?? '') } });
    if (!user) throw notFound('User not found');
    if (user.status !== UserStatus.PENDING) {
      throw badRequest(`User is already ${user.status.toLowerCase()}`);
    }

    const role = await requireAssignableRole(roleKey, req.auth);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ACTIVE, roleId: role.id },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.userId,
        action: 'user.approve',
        resource: 'users',
        resourceId: user.id,
        dataJson: { roleKey: role.key },
      },
    });

    res.json(serializeUser(updated));
  },
);

usersRouter.patch(
  '/users/:id/role',
  requireAuth,
  requirePermission('users', 'UPDATE'),
  validateBody(assignRoleSchema),
  async (req, res) => {
    const { roleKey } = req.body as z.infer<typeof assignRoleSchema>;

    const user = await prisma.user.findUnique({
      where: { id: String(req.params.id ?? '') },
      include: { role: true },
    });
    if (!user) throw notFound('User not found');

    // Demoting an existing privileged account is as sensitive as granting one.
    if (user.role && PRIVILEGED_ROLE_KEYS.has(user.role.key) && !can(req.auth, 'roles', 'UPDATE')) {
      throw forbidden(
        `Changing the role of a ${user.role.key} account requires role management rights`,
      );
    }

    const role = await requireAssignableRole(roleKey, req.auth);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { roleId: role.id },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.userId,
        action: 'user.role.assign',
        resource: 'users',
        resourceId: user.id,
        dataJson: { from: user.role?.key ?? null, to: role.key },
      },
    });

    res.json(serializeUser(updated));
  },
);

usersRouter.patch(
  '/users/:id/status',
  requireAuth,
  requirePermission('users', 'UPDATE'),
  validateBody(statusSchema),
  async (req, res) => {
    const { status } = req.body as z.infer<typeof statusSchema>;

    const user = await prisma.user.findUnique({
      where: { id: String(req.params.id ?? '') },
      include: { role: true },
    });
    if (!user) throw notFound('User not found');

    if (user.id === req.auth?.userId) {
      throw badRequest('You cannot change your own account status');
    }
    if (user.role && PRIVILEGED_ROLE_KEYS.has(user.role.key) && !can(req.auth, 'roles', 'UPDATE')) {
      throw forbidden(`Changing a ${user.role.key} account requires role management rights`);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { status },
      include: { role: true },
    });

    // A disabled account must stop working now, not when its refresh token expires.
    if (status === UserStatus.DISABLED) await revokeAllSessions(user.id);

    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.userId,
        action: 'user.status.update',
        resource: 'users',
        resourceId: user.id,
        dataJson: { from: user.status, to: status },
      },
    });

    res.json(serializeUser(updated));
  },
);

/** Rename or re-address an account. */
usersRouter.patch(
  '/users/:id',
  requireAuth,
  requirePermission('users', 'UPDATE'),
  validateBody(updateSchema),
  async (req, res) => {
    const { email, name } = req.body as z.infer<typeof updateSchema>;
    const user = await loadEditableUser(String(req.params.id ?? ''), req.auth);

    if (email && email !== user.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) throw conflict('An account with this email already exists');
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { ...(email ? { email } : {}), ...(name ? { name } : {}) },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.userId,
        action: 'user.update',
        resource: 'users',
        resourceId: user.id,
        dataJson: {
          ...(email && email !== user.email ? { email: { from: user.email, to: email } } : {}),
          ...(name && name !== user.name ? { name: { from: user.name, to: name } } : {}),
        },
      },
    });

    res.json(serializeUser(updated));
  },
);

/**
 * Set someone's password. This is the recovery path for an account that cannot
 * sign in: the panel has no self-serve reset, so an administrator sets a new
 * one and passes it on. Every existing session dies with the old credential —
 * if the account was compromised, leaving its sessions alive would defeat the
 * point of changing the password.
 */
usersRouter.post(
  '/users/:id/password',
  requireAuth,
  requirePermission('users', 'UPDATE'),
  validateBody(passwordBodySchema),
  async (req, res) => {
    const { password } = req.body as z.infer<typeof passwordBodySchema>;
    const user = await loadEditableUser(String(req.params.id ?? ''), req.auth);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        // A locked-out account should be usable again immediately.
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await revokeAllSessions(user.id);
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.userId,
        action: 'user.password.set',
        resource: 'users',
        resourceId: user.id,
        dataJson: { bySelf: user.id === req.auth?.userId },
      },
    });

    res.status(204).end();
  },
);

usersRouter.delete(
  '/users/:id',
  requireAuth,
  requirePermission('users', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (id === req.auth?.userId) throw badRequest('You cannot delete your own account');

    const user = await loadEditableUser(id, req.auth);

    // Audit rows outlive the account (the actor relation is SetNull), so the
    // record of what they did survives the deletion.
    await prisma.user.delete({ where: { id: user.id } });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.userId,
        action: 'user.delete',
        resource: 'users',
        resourceId: user.id,
        dataJson: { email: user.email, roleKey: user.role?.key ?? null },
      },
    });

    res.status(204).end();
  },
);

/**
 * Fetch a user for editing, refusing targets above the caller's ceiling. Acting
 * on a super_admin or admin account needs `roles:UPDATE`, so a plain `admin`
 * cannot rename, re-password or delete their way past their own level.
 */
async function loadEditableUser(id: string, auth: { permissions: string[] } | undefined) {
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) throw notFound('User not found');

  if (user.role && PRIVILEGED_ROLE_KEYS.has(user.role.key) && !can(auth, 'roles', 'UPDATE')) {
    throw forbidden(`Changing a ${user.role.key} account requires role management rights`);
  }

  return user;
}

async function requireAssignableRole(roleKey: string, auth: { permissions: string[] } | undefined) {
  const role = await prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) throw badRequest(`Unknown role "${roleKey}"`);

  if (PRIVILEGED_ROLE_KEYS.has(role.key) && !can(auth, 'roles', 'UPDATE')) {
    throw forbidden(`Assigning the ${role.key} role requires role management rights`);
  }

  return role;
}

function serializeUser(user: {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  role: { key: string; name: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    role: user.role ? { key: user.role.key, name: user.role.name } : null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
