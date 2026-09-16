import { Router } from 'express';
import { LeadStatus, MeetingFormat, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import { countHolders, SLOT_TAKEN_MESSAGE } from '../services/availability';

/**
 * Leads — every submission from the public site's lead-capture entry points
 * (Universal popup, Quiz popup, the Contact page's static form, and the
 * "Become a dealer" meeting-booking form; see `apps/web/lib/leads.ts`'s
 * `LeadPayload`). `POST /leads` is this API's first genuinely public *write* —
 * deliberately left off `requireAuth` (see `app.ts`'s top comment) since a
 * site visitor is never logged in.
 *
 * The dealer form books a time as well as asking a question, which is why this
 * route reads the diary (`GET /public/availability` is the matching read). It
 * still writes one `Lead` and nothing else: the visitor is applying to *become*
 * a partner, so there is no `Partner` to hang a `Booking` off — see the `Lead`
 * model's own comment for what that means for slot capacity.
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

const createLeadBodySchema = z
  .object({
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
    carLink: optionalText(500),

    /* The "Become a dealer" meeting-booking form's own fields. Optional like
     * every other widget's: one form asking them does not make them required
     * of the popup that does not. */
    company: optionalText(160),
    activityType: optionalText(120),
    meetingFormat: z.nativeEnum(MeetingFormat).optional(),
    /** Ignored when `meetingSlotId` is given — the slot's own start wins. */
    meetingAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
    meetingSlotId: z.string().min(1).optional(),
    meetingBranchId: z.string().min(1).optional(),
    meetingAddress: optionalText(300),

    sourcePage: z.string().trim().min(1).max(200),
    sourceCta: z.string().trim().min(1).max(200),
    locale: z.string().trim().min(1).max(10),
    device: z.string().trim().min(1).max(20),
    quizAnswers: z.record(z.string(), z.string()).optional(),
  })
  /* A booked meeting is all-or-nothing. A format with no time is a lead nobody
   * can keep, and a time with no format is a lead nobody knows where to keep —
   * so neither half is accepted on its own. */
  .refine((body) => !body.meetingFormat || Boolean(body.meetingAt ?? body.meetingSlotId), {
    message: 'Pick a meeting slot, or send a time',
    path: ['meetingAt'],
  })
  .refine((body) => !(body.meetingAt ?? body.meetingSlotId) || Boolean(body.meetingFormat), {
    message: 'Choose how the meeting happens',
    path: ['meetingFormat'],
  })
  /* Exactly one place per format — see the `MeetingFormat` doc comment. A
   * branch sent with `ONLINE` is not a harmless extra: it is two answers to
   * "where", and accepting it would leave the CRM showing an office for a call. */
  .refine(
    (body) => (body.meetingFormat === MeetingFormat.OFFICE) === Boolean(body.meetingBranchId),
    {
      message: 'Name the branch for an office meeting, and only for an office meeting',
      path: ['meetingBranchId'],
    },
  )
  .refine((body) => (body.meetingFormat === MeetingFormat.OTHER) === Boolean(body.meetingAddress), {
    message: 'Give the address for a meeting elsewhere, and only for a meeting elsewhere',
    path: ['meetingAddress'],
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
  const meetingAt = await resolveMeeting(body);
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
      carLink: body.carLink ?? null,
      company: body.company ?? null,
      activityType: body.activityType ?? null,
      meetingFormat: body.meetingFormat ?? null,
      meetingAt,
      meetingSlotId: body.meetingSlotId ?? null,
      meetingBranchId: body.meetingBranchId ?? null,
      meetingAddress: body.meetingAddress ?? null,
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

leadsRouter.get(
  '/leads/:id',
  requireAuth,
  requirePermission('leads', 'READ'),
  async (req, res) => {
    const lead = await prisma.lead.findUnique({ where: { id: String(req.params.id ?? '') } });
    if (!lead) throw notFound('Lead not found');
    res.json(serializeLead(lead));
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

/**
 * Settles when the booked meeting is, and refuses the ones that cannot be kept.
 * Returns `null` for every lead that booked nothing, which is most of them.
 *
 * Three rules live here rather than in the schema because each needs the
 * database:
 *
 * 1. **The slot wins.** Given a `meetingSlotId`, `meetingAt` comes from
 *    `slot.startsAt` and anything the caller sent is discarded — the same rule
 *    `POST /bookings` follows, and the reason the diary and the appointment
 *    cannot end up disagreeing about when it is.
 * 2. **A full window is not on offer.** Checked against `countHolders`, the one
 *    definition of occupancy, so a stale form that still shows 14:00 as free
 *    gets an honest 409 instead of booking over a confirmed appointment. Note
 *    this is a read, not a claim: a lead never consumes capacity (see the
 *    `Lead` model comment), so there is no race to serialize — two visitors may
 *    both ask for the last window, and a manager decides.
 * 3. **The slot and the branch must agree.** A branch-scoped window plus a
 *    different office is a contradiction, not a preference.
 */
async function resolveMeeting(body: z.infer<typeof createLeadBodySchema>): Promise<Date | null> {
  if (
    body.meetingBranchId &&
    !(await prisma.branch.findUnique({ where: { id: body.meetingBranchId } }))
  ) {
    throw badRequest('Unknown branch');
  }

  if (!body.meetingSlotId) {
    if (!body.meetingAt) return null;
    return assertFuture(new Date(body.meetingAt));
  }

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: body.meetingSlotId } });
  if (!slot) throw badRequest('Unknown availability slot');

  if (body.meetingBranchId && slot.branchId && slot.branchId !== body.meetingBranchId) {
    throw badRequest('That slot belongs to a different branch');
  }

  const held = (await countHolders([slot.id])).get(slot.id) ?? 0;
  if (held >= slot.capacity) throw conflict(SLOT_TAKEN_MESSAGE);

  return assertFuture(slot.startsAt);
}

/** A meeting in the past is a typo or a stale page, never a request. */
function assertFuture(at: Date): Date {
  if (at.getTime() <= Date.now()) throw badRequest('Pick a meeting time in the future');
  return at;
}

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
    carLink: lead.carLink,
    company: lead.company,
    activityType: lead.activityType,
    meetingFormat: lead.meetingFormat,
    meetingAt: lead.meetingAt?.toISOString() ?? null,
    meetingSlotId: lead.meetingSlotId,
    meetingBranchId: lead.meetingBranchId,
    meetingAddress: lead.meetingAddress,
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
