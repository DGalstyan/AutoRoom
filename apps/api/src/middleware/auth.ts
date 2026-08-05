import type { RequestHandler } from 'express';
import { UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../lib/tokens';
import { forbidden, unauthorized } from '../lib/errors';

/**
 * Bearer-token authentication. A2 layers `requirePermission(resource, action)`
 * on top of what this attaches.
 *
 * The token's signature is checked statelessly, but the user is then loaded
 * from the database on every request. That is a deliberate round-trip: a role
 * change, a disabled account or an edited permission matrix has to take effect
 * immediately, and a 15-minute-old JWT claim cannot express that.
 */

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: { key: string; name: string };
  /** `resource:action` strings, e.g. `cars:UPDATE`. */
  permissions: string[];
  /** True on a system-issued password the client must gate the panel behind. */
  mustChangePassword: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function loadAuthContext(userId: string): Promise<AuthContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  if (!user) throw unauthorized('Account no longer exists');
  if (user.status === UserStatus.PENDING) {
    throw forbidden('Your account is awaiting approval by an administrator');
  }
  if (user.status === UserStatus.DISABLED) throw forbidden('Your account has been disabled');

  // Only PENDING accounts are supposed to be role-less, and those are rejected
  // above. An ACTIVE user without a role means someone cleared it directly in
  // the database — refuse rather than fall back to an empty permission set that
  // would read as "authenticated but powerless" and be hard to diagnose.
  if (!user.role) {
    throw forbidden('Your account has no role assigned. Ask an administrator to assign one.');
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: { key: user.role.key, name: user.role.name },
    permissions: user.role.permissions.map(
      (grant) => `${grant.permission.resource}:${grant.permission.action}`,
    ),
    mustChangePassword: user.mustChangePassword,
  };
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw unauthorized('Authentication required');
    }
    const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
    req.auth = await loadAuthContext(payload.sub);
    next();
  } catch (error) {
    next(error);
  }
};
