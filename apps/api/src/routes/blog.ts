import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import { SUPPORTED_LOCALES } from '../lib/settings';

/**
 * Blog — `/blog` on the public site.
 *
 * Same shape and the same rule as the FAQ: an article may exist as a draft
 * without being finished, but cannot be *published* without an Armenian title
 * and body — the one language the site guarantees — so a half-written post never
 * reaches a visitor as an empty page. Text is per-language JSON; `ru`/`en` fill
 * in as translations are written and the site falls back to Armenian.
 */
export const blogRouter = Router();

export type LocalizedText = Partial<Record<(typeof SUPPORTED_LOCALES)[number], string>>;

const optionalLocaleText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal('')])
    .optional()
    .transform((value) => (value ? value : undefined));

const titleSchema = z.object({
  hy: z.string().trim().min(1, 'An Armenian title is required').max(160),
  ru: optionalLocaleText(160),
  en: optionalLocaleText(160),
});

const excerptSchema = z
  .object({ hy: optionalLocaleText(400), ru: optionalLocaleText(400), en: optionalLocaleText(400) })
  .nullable()
  .default(null)
  .transform((value) => (value && (value.hy || value.ru || value.en) ? value : null));

const bodySchema = z.object({
  hy: optionalLocaleText(20000),
  ru: optionalLocaleText(20000),
  en: optionalLocaleText(20000),
});

const postBodySchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lower-case letters, digits and hyphens'),
    title: titleSchema,
    excerpt: excerptSchema,
    body: bodySchema,
    coverUrl: z
      .union([z.string().url().max(2048), z.literal('')])
      .optional()
      .transform((value) => value || null),
    published: z.boolean().default(false),
  })
  .refine((body) => !body.published || Boolean(body.body.hy), {
    message: 'Write the Armenian article text before publishing',
    path: ['body'],
  });

const listQuerySchema = z.object({
  published: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

/* ---------------------------------- admin ---------------------------------- */

blogRouter.get(
  '/blog',
  requireAuth,
  requirePermission('blog', 'READ'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;
    const where: Prisma.BlogPostWhereInput =
      query.published === undefined
        ? {}
        : query.published
          ? { publishedAt: { not: null } }
          : { publishedAt: null };
    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
        take: query.take,
        skip: query.skip,
      }),
      prisma.blogPost.count({ where }),
    ]);
    res.json({ items: items.map(serializePost), total, take: query.take, skip: query.skip });
  },
);

blogRouter.get('/blog/:id', requireAuth, requirePermission('blog', 'READ'), async (req, res) => {
  const post = await prisma.blogPost.findUnique({ where: { id: String(req.params.id ?? '') } });
  if (!post) throw notFound('Article not found');
  res.json(serializePost(post));
});

blogRouter.post(
  '/blog',
  requireAuth,
  requirePermission('blog', 'CREATE'),
  validateBody(postBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof postBodySchema>;
    await assertSlugFree(body.slug);
    const post = await prisma.blogPost.create({ data: toWriteData(body, null) });
    await audit(req.auth?.userId, 'blog.create', post.id, { slug: post.slug });
    res.status(201).json(serializePost(post));
  },
);

blogRouter.put(
  '/blog/:id',
  requireAuth,
  requirePermission('blog', 'UPDATE'),
  validateBody(postBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw notFound('Article not found');
    const body = req.body as z.infer<typeof postBodySchema>;
    if (body.slug !== existing.slug) await assertSlugFree(body.slug);
    const post = await prisma.blogPost.update({
      where: { id },
      data: toWriteData(body, existing.publishedAt),
    });
    await audit(req.auth?.userId, 'blog.update', id, { slug: post.slug });
    res.json(serializePost(post));
  },
);

blogRouter.post(
  '/blog/:id/publish',
  requireAuth,
  requirePermission('blog', 'PUBLISH'),
  validateBody(z.object({ published: z.boolean() })),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const { published } = req.body as { published: boolean };
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw notFound('Article not found');
    // The rule the body schema enforces, on the path that skips it.
    if (published && !(existing.body as LocalizedText).hy) {
      throw badRequest('Write the Armenian article text before publishing');
    }
    const post = await prisma.blogPost.update({
      where: { id },
      data: { publishedAt: published ? (existing.publishedAt ?? new Date()) : null },
    });
    await audit(req.auth?.userId, published ? 'blog.publish' : 'blog.unpublish', id, {
      slug: post.slug,
    });
    res.json(serializePost(post));
  },
);

blogRouter.delete(
  '/blog/:id',
  requireAuth,
  requirePermission('blog', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw notFound('Article not found');
    await prisma.blogPost.delete({ where: { id } });
    await audit(req.auth?.userId, 'blog.delete', id, { slug: post.slug });
    res.status(204).end();
  },
);

/* ---------------------------------- public ---------------------------------- */

const publicWhere = { publishedAt: { not: null } } satisfies Prisma.BlogPostWhereInput;

blogRouter.get(
  '/public/blog',
  validateQuery(listQuerySchema.pick({ take: true, skip: true })),
  async (req, res) => {
    const { take, skip } = req.query as unknown as { take: number; skip: number };
    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: publicWhere,
        orderBy: { publishedAt: 'desc' },
        take,
        skip,
      }),
      prisma.blogPost.count({ where: publicWhere }),
    ]);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ items: items.map(serializePost), total, take, skip });
  },
);

blogRouter.get('/public/blog/:slug', async (req, res) => {
  const post = await prisma.blogPost.findFirst({
    where: { ...publicWhere, slug: String(req.params.slug ?? '') },
  });
  if (!post) throw notFound('Article not found');
  res.set('Cache-Control', 'public, max-age=60');
  res.json(serializePost(post));
});

/* --------------------------------- helpers --------------------------------- */

async function assertSlugFree(slug: string) {
  if (await prisma.blogPost.findUnique({ where: { slug } })) {
    throw conflict('Another article already uses this URL');
  }
}

function toWriteData(body: z.infer<typeof postBodySchema>, previous: Date | null) {
  return {
    slug: body.slug,
    title: body.title,
    excerpt: body.excerpt ?? Prisma.DbNull,
    body: body.body,
    coverUrl: body.coverUrl,
    publishedAt: body.published ? (previous ?? new Date()) : null,
  };
}

function serializePost(post: Prisma.BlogPostGetPayload<object>) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title as LocalizedText,
    excerpt: post.excerpt as LocalizedText | null,
    body: post.body as LocalizedText,
    coverUrl: post.coverUrl,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'blog',
      resourceId,
      dataJson: data as never,
    },
  });
}
