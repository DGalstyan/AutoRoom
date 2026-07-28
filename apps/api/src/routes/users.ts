import { Router } from 'express';
import { UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, forbidden, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { can, requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import { revokeAllSessions } from '../services/session';

/**
 * User administration — approving self-registered accounts and assigning roles
 * (`references/admin.md` A2).
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
