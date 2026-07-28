import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, forbidden, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { ACTIONS, RESOURCES, type Action, type Resource } from '../rbac/permissions';

/**
 * Role and permission management — `references/admin.md` A2.
 *
 * Reading is gated on `roles:READ` (admin and above, so the admin UI can show
 * what a role does) and editing on `roles:UPDATE`, which by default only
 * `super_admin` holds. That is the matrix guarding itself: nothing here names a
 * role, so changing who may edit roles is a data change, not a code change.
 */
export const rolesRouter = Router();

const permissionPairSchema = z.object({
  resource: z.string().min(1),
  action: z.enum(ACTIONS),
});

const updatePermissionsSchema = z.object({
  permissions: z.array(permissionPairSchema).max(500),
});

/** The full catalogue, so the admin UI can render the matrix as a grid. */
rolesRouter.get(
  '/permissions',
  requireAuth,
  requirePermission('roles', 'READ'),
  async (_req, res) => {
    const stored = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    res.json({
      resources: Object.fromEntries(
        Object.entries(RESOURCES).map(([resource, actions]) => [resource, [...actions]]),
      ),
      permissions: stored.map((p) => ({ id: p.id, resource: p.resource, action: p.action })),
    });
  },
);

rolesRouter.get('/roles', requireAuth, requirePermission('roles', 'READ'), async (_req, res) => {
  const roles = await prisma.role.findMany({
    orderBy: { key: 'asc' },
    include: { _count: { select: { permissions: true, users: true } } },
  });

  res.json(
    roles.map((role) => ({
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissionCount: role._count.permissions,
      userCount: role._count.users,
    })),
  );
});

rolesRouter.get(
  '/roles/:key',
  requireAuth,
  requirePermission('roles', 'READ'),
  async (req, res) => {
    const role = await prisma.role.findUnique({
      where: { key: String(req.params.key ?? '') },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw notFound('Role not found');

    res.json({
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions
        .map((grant) => ({ resource: grant.permission.resource, action: grant.permission.action }))
        .sort((a, b) => a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action)),
    });
  },
);

/**
 * Replace a role's grants wholesale. A full set rather than add/remove deltas:
 * the admin UI edits a checkbox grid, and sending the whole grid removes any
 * chance of two concurrent edits merging into a state neither operator chose.
 */
rolesRouter.put(
  '/roles/:key/permissions',
  requireAuth,
  requirePermission('roles', 'UPDATE'),
  validateBody(updatePermissionsSchema),
  async (req, res) => {
    const key = String(req.params.key ?? '');
    const { permissions } = req.body as z.infer<typeof updatePermissionsSchema>;

    const role = await prisma.role.findUnique({
      where: { key },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw notFound('Role not found');

    // Locking anyone out of role management is unrecoverable without database
    // access, so super_admin's own grants are not editable through the API.
    if (role.key === 'super_admin') {
      throw forbidden(
        'The super_admin role always holds every permission and cannot be edited. ' +
          'Create a separate role if you need a narrower set.',
      );
    }

    // Reject unknown pairs rather than silently dropping them — a typo in the
    // resource name would otherwise look like a successful save that did nothing.
    const unknown = permissions.filter(({ resource, action }) => {
      const actions = RESOURCES[resource as Resource] as readonly Action[] | undefined;
      return !actions?.includes(action);
    });
    if (unknown.length > 0) {
      throw badRequest('Unknown resource/action pairs', { unknown });
    }

    const wanted = await prisma.permission.findMany({
      where: { OR: permissions.map(({ resource, action }) => ({ resource, action })) },
    });

    const before = role.permissions.map(
      (grant) => `${grant.permission.resource}:${grant.permission.action}`,
    );
    const after = wanted.map((p) => `${p.resource}:${p.action}`);

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: wanted.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
        skipDuplicates: true,
      }),
      prisma.auditLog.create({
        data: {
          actorId: req.auth?.userId,
          action: 'role.permissions.update',
          resource: 'roles',
          resourceId: role.id,
          dataJson: {
            role: role.key,
            added: after.filter((entry) => !before.includes(entry)),
            removed: before.filter((entry) => !after.includes(entry)),
          },
        },
      }),
    ]);

    res.json({
      key: role.key,
      permissions: wanted
        .map((p) => ({ resource: p.resource, action: p.action }))
        .sort((a, b) => a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action)),
    });
  },
);
