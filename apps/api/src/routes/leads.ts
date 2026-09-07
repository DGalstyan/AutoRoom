import { Router } from 'express';
import { LeadStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';

/**
 * Leads — every submission from the public site's lead-capture entry points
 * (Universal popup, Quiz popup, the Contact page's static form; see
 * `apps/web/lib/leads.ts`'s `LeadPayload`). `POST /leads` is this API's
 * first genuinely public *write* — deliberately left off `requireAuth` (see
 * `app.ts`'s top comment) since a site visitor is never logged in.
 *
 * `apps/web` never calls this from the browser: it goes through a Next.js
 * Server Action (`apps/web/lib/actions/leads.ts`) over the same trusted
 * internal network every other fetch on the site already uses, so this
 * route only ever needs to trust traffic from that one server — no CORS
 * opening for the public site's own origin was needed for this to work.
 *
 * No rate-limiting or spam filtering yet — worth adding before this sees
 * real public traffic at scale, but out of scope for wiring the pipe itself.
 */
export const leadsRouter = Router();

const optionalText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal('')])
    .optional()
    .transform((value) => (value ? value : undefined));

const createLeadBodySchema = z.object({
  name: z.string().trim().min(1, 'A name is required').max(120),
  phone: z.string().trim().min(1, 'A phone number is required').max(40),
  email: optionalText(200),

  topic: optionalText(120),
  interest: optionalText(40),
  budget: optionalText(40),
  financing: optionalText(40),
  timing: optionalText(40),
  channel: optionalText(40),
  color: optionalText(40),
  comment: optionalText(4000),

  carName: optionalText(200),
  carVin: optionalText(40),

  sourcePage: z.string().trim().min(1).max(200),
  sourceCta: z.string().trim().min(1).max(200),
  locale: z.string().trim().min(1).max(10),
  device: z.string().trim().min(1).max(20),
  quizAnswers: z.record(z.string(), z.string()).optional(),
});

const listQuerySchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

const updateLeadBodySchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  notes: optionalText(4000),
});

/** Public — any site visitor's browser reaches this indirectly via the
 * web app's Server Action, never directly. */
leadsRouter.post('/leads', validateBody(createLeadBodySchema), async (req, res) => {
  const body = req.body as z.infer<typeof createLeadBodySchema>;
  const lead = await prisma.lead.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email ?? null,
      topic: body.topic ?? null,
      interest: body.interest ?? null,
      budget: body.budget ?? null,
      financing: body.financing ?? null,
      timing: body.timing ?? null,
      channel: body.channel ?? null,
      color: body.color ?? null,
      comment: body.comment ?? null,
      carName: body.carName ?? null,
      carVin: body.carVin ?? null,
      sourcePage: body.sourcePage,
      sourceCta: body.sourceCta,
      locale: body.locale,
      device: body.device,
      quizAnswersJson: body.quizAnswers ?? Prisma.JsonNull,
    },
  });
  res.status(201).json(serializeLead(lead));
});

leadsRouter.get(
  '/leads',
  requireAuth,
  requirePermission('leads', 'READ'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const { status, take, skip } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
      prisma.lead.count({ where }),
    ]);

    res.json({ items: items.map(serializeLead), total, take, skip });
  },
);

leadsRouter.patch(
  '/leads/:id',
  requireAuth,
  requirePermission('leads', 'UPDATE'),
  validateBody(updateLeadBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.lead.findUnique({ where: { id } }))) throw notFound('Lead not found');

    const body = req.body as z.infer<typeof updateLeadBodySchema>;
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ?? null } : {}),
      },
    });

    await audit(req.auth?.userId, 'leads.update', id, { status: lead.status });
    res.json(serializeLead(lead));
  },
);

leadsRouter.delete(
  '/leads/:id',
  requireAuth,
  requirePermission('leads', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw notFound('Lead not found');

    await prisma.lead.delete({ where: { id } });
    await audit(req.auth?.userId, 'leads.delete', id, { name: lead.name });
    res.status(204).end();
  },
);

/* --------------------------------- helpers --------------------------------- */

function serializeLead(lead: Prisma.LeadGetPayload<object>) {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    topic: lead.topic,
    interest: lead.interest,
    budget: lead.budget,
    financing: lead.financing,
    timing: lead.timing,
    channel: lead.channel,
    color: lead.color,
    comment: lead.comment,
    carName: lead.carName,
    carVin: lead.carVin,
    sourcePage: lead.sourcePage,
    sourceCta: lead.sourceCta,
    locale: lead.locale,
    device: lead.device,
    quizAnswers: (lead.quizAnswersJson as Record<string, string> | null) ?? null,
    status: lead.status,
    notes: lead.notes,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'leads',
      resourceId,
      dataJson: data as never,
    },
  });
}
