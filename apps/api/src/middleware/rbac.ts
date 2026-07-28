import type { RequestHandler } from 'express';
import { forbidden, unauthorized } from '../lib/errors';
import type { Action, Resource } from '../rbac/permissions';

/**
 * Route guard for the `role × resource × action` matrix.
 *
 * The check reads the permissions `requireAuth` loaded from the database on
 * this request, not anything baked into the token — which is what makes roles
 * genuinely data-driven: a super_admin editing a role's grants changes what
 * everyone holding that role can do on their very next request, with no
 * re-login and no deploy.
 *
 * Always mount behind `requireAuth`:
 *   router.patch('/cars/:id', requireAuth, requirePermission('cars', 'UPDATE'), handler)
 */
export function requirePermission(resource: Resource, action: Action): RequestHandler {
  const needed = `${resource}:${action}`;

  return (req, _res, next) => {
    if (!req.auth) {
      // A programming error rather than a client one — the guard is mounted
      // without `requireAuth` in front of it.
      next(unauthorized('Authentication required'));
      return;
    }

    if (!req.auth.permissions.includes(needed)) {
      next(forbidden(`Your role (${req.auth.role.key}) cannot ${action} ${resource}`));
      return;
    }

    next();
  };
}

/** True if the current request holds a permission — for conditional logic in handlers. */
export function can(
  auth: { permissions: string[] } | undefined,
  resource: Resource,
  action: Action,
): boolean {
  return Boolean(auth?.permissions.includes(`${resource}:${action}`));
}
