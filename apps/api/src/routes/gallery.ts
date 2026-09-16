import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';

/**
 * Gallery images — the photo collage on the About page's S4 section, right
 * below the team grid (`PhotoGallery` in apps/web). This route is what lets
 * an admin add, reorder, or remove a photo without a deploy, the same way
 * `team.ts` does for team members.
 */
export const galleryRouter = Router();

const galleryImageBodySchema = z.object({
  imageUrl: z.string().url().max(2048),
  /// Order of the tiles in the collage — see `PhotoGallery`'s own comment
  /// for how a slot with no matching image falls back to a bundled default.
  position: z.number().int().min(0).max(999).default(0),
});

const ORDER = [{ position: 'asc' }] satisfies Prisma.GalleryImageOrderByWithRelationInput[];

galleryRouter.get(
  '/gallery',
  requireAuth,
  requirePermission('gallery', 'READ'),
  async (_req, res) => {
    const items = await prisma.galleryImage.findMany({ orderBy: ORDER });
    res.json({ items: items.map(serializeGalleryImage), total: items.length });
  },
);

galleryRouter.post(
  '/gallery',
  requireAuth,
  requirePermission('gallery', 'CREATE'),
  validateBody(galleryImageBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof galleryImageBodySchema>;
    const image = await prisma.galleryImage.create({ data: body });

    await audit(req.auth?.userId, 'gallery.create', image.id, { imageUrl: image.imageUrl });
    res.status(201).json(serializeGalleryImage(image));
  },
);

galleryRouter.put(
  '/gallery/:id',
  requireAuth,
  requirePermission('gallery', 'UPDATE'),
  validateBody(galleryImageBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.galleryImage.findUnique({ where: { id } })))
      throw notFound('Gallery image not found');

    const image = await prisma.galleryImage.update({
      where: { id },
      data: req.body as z.infer<typeof galleryImageBodySchema>,
    });

    await audit(req.auth?.userId, 'gallery.update', id, { imageUrl: image.imageUrl });
    res.json(serializeGalleryImage(image));
  },
);

galleryRouter.delete(
  '/gallery/:id',
  requireAuth,
  requirePermission('gallery', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) throw notFound('Gallery image not found');

    await prisma.galleryImage.delete({ where: { id } });
    await audit(req.auth?.userId, 'gallery.delete', id, { imageUrl: image.imageUrl });
    res.status(204).end();
  },
);

/** Unauthenticated — the About page's photo collage reads this. */
galleryRouter.get('/public/gallery', async (_req, res) => {
  const items = await prisma.galleryImage.findMany({ orderBy: ORDER });
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ items: items.map(serializeGalleryImage), total: items.length });
});

/* --------------------------------- helpers --------------------------------- */

function serializeGalleryImage(image: Prisma.GalleryImageGetPayload<object>) {
  return {
    id: image.id,
    imageUrl: image.imageUrl,
    position: image.position,
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'gallery',
      resourceId,
      dataJson: data as never,
    },
  });
}
