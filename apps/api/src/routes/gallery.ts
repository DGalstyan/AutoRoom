import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, notFound } from '../lib/errors';
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
  /// Display order of the tiles in the collage — lower shows first.
  position: z.number().int().min(0).max(999).default(0),
});

/** The whole collage's new front-to-back order, not a `{ id, position }[]`
 * diff — the admin UI always has every row in hand after a swap. */
const galleryReorderSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1).max(999),
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

/**
 * Persists a new front-to-back order for the whole collage after the admin
 * swaps two tiles — `imageIds[i]`'s row gets `position: i`. Every existing
 * id must be present so a stale client (a second tab that added or removed
 * a tile since this one loaded) fails loudly instead of dropping or
 * mis-ordering rows it never showed.
 */
galleryRouter.patch(
  '/gallery/reorder',
  requireAuth,
  requirePermission('gallery', 'UPDATE'),
  validateBody(galleryReorderSchema),
  async (req, res) => {
    const { imageIds } = req.body as z.infer<typeof galleryReorderSchema>;

    const existing = await prisma.galleryImage.findMany();
    const existingIds = new Set(existing.map((image) => image.id));
    if (imageIds.length !== existing.length || imageIds.some((id) => !existingIds.has(id))) {
      throw badRequest('imageIds must be exactly the gallery’s current image ids');
    }

    await prisma.$transaction(
      imageIds.map((imageId, position) =>
        prisma.galleryImage.update({ where: { id: imageId }, data: { position } }),
      ),
    );

    const images = await prisma.galleryImage.findMany({ orderBy: ORDER });
    res.json(images.map(serializeGalleryImage));
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
