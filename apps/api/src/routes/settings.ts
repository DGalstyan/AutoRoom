import { Router } from 'express';
import { notFound } from '../lib/errors';
import { getAllSettings, getPublicSettings, isSettingKey, writeSetting } from '../lib/settings';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

/**
 * Settings — `references/admin.md` A3.
 *
 * Two audiences with different rights: the admin reads and writes the whole
 * registry behind `settings:READ` / `settings:UPDATE`, and the public site
 * reads a marked-public subset with no authentication at all. They are separate
 * handlers rather than one filtered by role, so there is no path where a
 * misjudged condition serves the private set to an anonymous caller.
 */
export const settingsRouter = Router();

/**
 * Unauthenticated. Declared before the guarded routes because `/settings/public`
 * would otherwise be captured by `/settings/:key`.
 */
settingsRouter.get('/settings/public', async (_req, res) => {
  const settings = await getPublicSettings();
  // Short public cache: a rebrand should reach visitors quickly, but every page
  // render asking again is wasteful.
  res.set('Cache-Control', 'public, max-age=60');
  res.json(settings);
});

settingsRouter.get(
  '/settings',
  requireAuth,
  requirePermission('settings', 'READ'),
  async (_req, res) => {
    res.json(await getAllSettings());
  },
);

settingsRouter.put(
  '/settings/:key',
  requireAuth,
  requirePermission('settings', 'UPDATE'),
  async (req, res) => {
    const key = String(req.params.key ?? '');
    if (!isSettingKey(key)) throw notFound(`Unknown setting "${key}"`);

    // A thrown ZodError (the schema is per-key, so it can't be bound to
    // `validateBody`) reaches the shared error handler, which shapes it the
    // same `{ fields }` way as every other route's validation failures.
    const value = await writeSetting(key, req.body, req.auth?.userId);
    res.json({ key, value });
  },
);
