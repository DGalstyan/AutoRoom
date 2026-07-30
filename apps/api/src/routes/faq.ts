import { Router } from 'express';
import { FaqTopic, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';

/**
 * FAQ — Homepage S9, and the China and USA page sections.
 *
 * The homepage aggregates every topic; the China and USA pages ask for theirs.
 * That is one table with a `topic`, not three lists to keep in step.
 *
 * The rule worth knowing is that a question may exist without an answer but
 * cannot be *published* without one. `references/faq.md` ships ten China
 * questions whose answers the content team has not written, and the honest way
 * to hold them is as drafts rather than as questions answered with an empty
 * string that would render as a blank accordion on the live site.
 */
export const faqRouter = Router();

/* --------------------------------- schemas --------------------------------- */

const faqBodySchema = z
  .object({
    topic: z.nativeEnum(FaqTopic),
    question: z.string().trim().min(1, 'A question is required').max(300),
    answer: z
      .union([z.string().trim().max(4000), z.literal(''), z.null()])
      .transform((value) => (value === '' ? null : value))
      .nullish(),
    position: z.number().int().min(0).max(999).default(0),
    published: z.boolean().default(false),
  })
  .refine((body) => !body.published || Boolean(body.answer), {
    message: 'Write an answer before publishing this question',
    path: ['answer'],
  });

const listQuerySchema = z.object({
  topic: z.nativeEnum(FaqTopic).optional(),
  published: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  take: z.coerce.number().int().min(1).max(200).default(200),
  skip: z.coerce.number().int().min(0).default(0),
});

/* ---------------------------------- routes ---------------------------------- */

faqRouter.get(
  '/faq',
  requireAuth,
  requirePermission('faq', 'READ'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;

    const where: Prisma.FaqWhereInput = {
      ...(query.topic ? { topic: query.topic } : {}),
      ...(query.published === undefined
        ? {}
        : query.published
          ? { publishedAt: { not: null } }
          : { publishedAt: null }),
    };

    const [items, total] = await Promise.all([
      prisma.faq.findMany({ where, orderBy: ORDER, take: query.take, skip: query.skip }),
      prisma.faq.count({ where }),
    ]);

    res.json({ items: items.map(serializeFaq), total, take: query.take, skip: query.skip });
  },
);

faqRouter.post(
  '/faq',
  requireAuth,
  requirePermission('faq', 'CREATE'),
  validateBody(faqBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof faqBodySchema>;
    const item = await prisma.faq.create({ data: toWriteData(body) });

    await audit(req.auth?.userId, 'faq.create', item.id, { topic: item.topic });
    res.status(201).json(serializeFaq(item));
  },
);

faqRouter.put(
  '/faq/:id',
  requireAuth,
  requirePermission('faq', 'UPDATE'),
  validateBody(faqBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) throw notFound('Question not found');

    const body = req.body as z.infer<typeof faqBodySchema>;
    const item = await prisma.faq.update({
      where: { id },
      data: {
        ...toWriteData(body),
        // Keep the original publish moment rather than restamping it on every
        // edit — "published on" should mean when it went out.
        publishedAt: body.published ? (existing.publishedAt ?? new Date()) : null,
      },
    });

    await audit(req.auth?.userId, 'faq.update', id, { topic: item.topic });
    res.json(serializeFaq(item));
  },
);

/**
 * Publish or unpublish on its own, so the list can do it in one click.
 *
 * Separate from `PUT` because it is the action people actually take once the
 * answer is written, and sending the whole record back to flip one flag is how
 * a stale field overwrites a fresh one.
 */
faqRouter.post(
  '/faq/:id/publish',
  requireAuth,
  requirePermission('faq', 'PUBLISH'),
  validateBody(z.object({ published: z.boolean() })),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const { published } = req.body as { published: boolean };

    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) throw notFound('Question not found');

    // The same rule the body schema enforces, applied on the path that does not
    // go through it. A guard only one route honours is not a guard.
    if (published && !existing.answer) {
      throw badRequest('Write an answer before publishing this question');
    }

    const item = await prisma.faq.update({
      where: { id },
      data: { publishedAt: published ? (existing.publishedAt ?? new Date()) : null },
    });

    await audit(req.auth?.userId, published ? 'faq.publish' : 'faq.unpublish', id, {
      topic: item.topic,
    });
    res.json(serializeFaq(item));
  },
);

faqRouter.delete('/faq/:id', requireAuth, requirePermission('faq', 'DELETE'), async (req, res) => {
  const id = String(req.params.id ?? '');
  const item = await prisma.faq.findUnique({ where: { id } });
  if (!item) throw notFound('Question not found');

  await prisma.faq.delete({ where: { id } });
  await audit(req.auth?.userId, 'faq.delete', id, { topic: item.topic });
  res.status(204).end();
});

/* ------------------------------- public read ------------------------------- */

/**
 * What the website reads. Published rows only, and only ones with an answer —
 * belt and braces, since an unanswered question should be unpublishable in the
 * first place and a blank accordion is the worst possible failure mode here.
 *
 * No `topic` means the homepage's aggregated set: every topic, in order.
 */
faqRouter.get(
  '/public/faq',
  validateQuery(listQuerySchema.pick({ topic: true })),
  async (req, res) => {
    const { topic } = req.query as unknown as { topic?: FaqTopic };

    const items = await prisma.faq.findMany({
      where: {
        publishedAt: { not: null },
        answer: { not: null },
        ...(topic ? { topic } : {}),
      },
      orderBy: [{ topic: 'asc' }, ...ORDER],
      take: 200,
    });

    res.set('Cache-Control', 'public, max-age=300');
    res.json({ items: items.map(serializeFaq), total: items.length });
  },
);

/* --------------------------------- helpers --------------------------------- */

const ORDER = [
  { position: 'asc' },
  { createdAt: 'asc' },
] satisfies Prisma.FaqOrderByWithRelationInput[];

function toWriteData(body: z.infer<typeof faqBodySchema>) {
  return {
    topic: body.topic,
    question: body.question,
    answer: body.answer ?? null,
    position: body.position,
    publishedAt: body.published ? new Date() : null,
  };
}

function serializeFaq(item: Prisma.FaqGetPayload<object>) {
  return {
    id: item.id,
    topic: item.topic,
    question: item.question,
    answer: item.answer,
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
      resource: 'faq',
      resourceId,
      dataJson: data as never,
    },
  });
}
