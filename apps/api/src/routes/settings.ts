import { Router } from 'express';
import { z } from 'zod';
import { badRequest, notFound } from '../lib/errors';
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

    try {
      const value = await writeSetting(key, req.body, req.auth?.userId);
      res.json({ key, value });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Field-addressed messages so the form can mark the offending input
        // rather than showing one generic banner.
        throw badRequest('Some values are not valid', {
          fields: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      throw error;
    }
  },
);
