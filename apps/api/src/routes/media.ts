import { Router } from 'express';
import { CarOrigin, MediaKind, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';

/**
 * Video the site plays — the homepage Customer Story Wall (S7), the founder
 * film (S6), and guide reels.
 *
 * The file itself goes through `POST /uploads`, which already accepts mp4 and
 * webm; what is stored here is the URL that came back. So this module never
 * touches a file, which is what keeps swapping local disk for S3 a change to
 * one route rather than to every screen that shows a video.
 *
 * Publishing is `media:PUBLISH`-free on purpose: `media` has no PUBLISH action
 * in the matrix, so `publishedAt` moves with UPDATE like any other field.
 */
export const mediaRouter = Router();

/* --------------------------------- schemas --------------------------------- */

const mediaBodySchema = z.object({
  kind: z.nativeEnum(MediaKind),
  title: z.string().trim().min(1, 'A title is required').max(160),
  videoUrl: z.string().url().max(2048),
  posterUrl: z
    .union([z.string().url().max(2048), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullish(),

  customerName: z.string().trim().max(120).nullish(),
  carLabel: z.string().trim().max(120).nullish(),
  origin: z.nativeEnum(CarOrigin).nullish(),
  whyChosen: z.string().trim().max(2000).nullish(),
  experience: z.string().trim().max(2000).nullish(),

  position: z.number().int().min(0).max(999).default(0),
  published: z.boolean().default(false),
});

const listQuerySchema = z.object({
  kind: z.nativeEnum(MediaKind).optional(),
  published: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

/* ---------------------------------- routes ---------------------------------- */

mediaRouter.get(
  '/media',
  requireAuth,
  requirePermission('media', 'READ'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;

    const where: Prisma.MediaWhereInput = {
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.published === undefined
        ? {}
        : query.published
          ? { publishedAt: { not: null } }
          : { publishedAt: null }),
    };

    const [items, total] = await Promise.all([
      prisma.media.findMany({ where, orderBy: ORDER, take: query.take, skip: query.skip }),
      prisma.media.count({ where }),
    ]);

    res.json({ items: items.map(serializeMedia), total, take: query.take, skip: query.skip });
  },
);

mediaRouter.post(
  '/media',
  requireAuth,
  requirePermission('media', 'CREATE'),
  validateBody(mediaBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof mediaBodySchema>;

    const item = await prisma.media.create({ data: toWriteData(body) });
    await audit(req.auth?.userId, 'media.create', item.id, { kind: item.kind, title: item.title });
    res.status(201).json(serializeMedia(item));
  },
);

mediaRouter.put(
  '/media/:id',
  requireAuth,
  requirePermission('media', 'UPDATE'),
  validateBody(mediaBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const existing = await prisma.media.findUnique({ where: { id } });
    if (!existing) throw notFound('Media not found');

    const body = req.body as z.infer<typeof mediaBodySchema>;
    const item = await prisma.media.update({
      where: { id },
      // Keep the original publish moment when it was already live, rather than
      // restamping it on every edit — "published on" should mean when it went
      // out, not when someone last fixed a typo.
      data: {
        ...toWriteData(body),
        publishedAt: body.published ? (existing.publishedAt ?? new Date()) : null,
      },
    });

    await audit(req.auth?.userId, 'media.update', id, { kind: item.kind, title: item.title });
    res.json(serializeMedia(item));
  },
);

mediaRouter.delete(
  '/media/:id',
  requireAuth,
  requirePermission('media', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const item = await prisma.media.findUnique({ where: { id } });
    if (!item) throw notFound('Media not found');

    // The uploaded file is deliberately left on disk. It may be referenced by
    // something else, and an orphaned file costs less than a video that
    // disappears from a page nobody was looking at.
    await prisma.media.delete({ where: { id } });
    await audit(req.auth?.userId, 'media.delete', id, { title: item.title });
    res.status(204).end();
  },
);

/* ------------------------------- public read ------------------------------- */

/**
 * What the website reads — published rows only, and a separate handler rather
 * than a flag on the guarded list, so the filter is not a condition someone can
 * forget to apply.
 */
mediaRouter.get(
  '/public/media',
  validateQuery(listQuerySchema.pick({ kind: true })),
  async (req, res) => {
    const { kind } = req.query as unknown as { kind?: MediaKind };

    const items = await prisma.media.findMany({
      where: { publishedAt: { not: null }, ...(kind ? { kind } : {}) },
      orderBy: ORDER,
      take: 100,
    });

    res.set('Cache-Control', 'public, max-age=60');
    res.json({ items: items.map(serializeMedia), total: items.length });
  },
);

/* --------------------------------- helpers --------------------------------- */

/** Editor-chosen order first; newest wins ties so a fresh row is not buried. */
const ORDER = [
  { position: 'asc' },
  { createdAt: 'desc' },
] satisfies Prisma.MediaOrderByWithRelationInput[];

function toWriteData(body: z.infer<typeof mediaBodySchema>) {
  return {
    kind: body.kind,
    title: body.title,
    videoUrl: body.videoUrl,
    posterUrl: body.posterUrl ?? null,
    customerName: body.customerName ?? null,
    carLabel: body.carLabel ?? null,
    origin: body.origin ?? null,
    whyChosen: body.whyChosen ?? null,
    experience: body.experience ?? null,
    position: body.position,
    publishedAt: body.published ? new Date() : null,
  };
}

function serializeMedia(item: Prisma.MediaGetPayload<object>) {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    videoUrl: item.videoUrl,
    posterUrl: item.posterUrl,
    customerName: item.customerName,
    carLabel: item.carLabel,
    origin: item.origin,
    whyChosen: item.whyChosen,
    experience: item.experience,
    position: item.position,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'media',
      resourceId,
      dataJson: data as never,
    },
  });
}
