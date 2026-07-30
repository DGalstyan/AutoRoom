import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePartner } from '../middleware/partner';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import { countHolders, inSlotTransaction, occupiedBy } from '../services/availability';

/**
 * The bookable diary — `references/admin.md` C3.
 *
 * Staff edit slots through `/availability` behind the `availability` matrix
 * entry. A partner reads `/portal/availability`, which returns only what is
 * still open and only in the future, because a diary is the one screen where
 * showing something already taken wastes the reader's time.
 */
export const availabilityRouter = Router();

/* ------------------------------ time handling ------------------------------ */

/**
 * Wall-clock in, UTC out.
 *
 * The generator is given a local date, a local time-of-day and the client's
 * offset, not an instant — "Tuesdays, 10:00–18:00" means 10:00 *in Yerevan*,
 * and storing whatever UTC that happened to be on the server would put the
 * showroom's morning slots at 06:00 for everyone reading them back.
 */
function utcFromLocal(date: string, minutesOfDay: number, offsetMinutes: number): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day) + (minutesOfDay - offsetMinutes) * 60_000);
}

/** Weekday of a local calendar date, Sunday = 0 — independent of the server's zone. */
function weekdayOf(date: string): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** `'HH:mm'` → minutes past local midnight. */
function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number) as [number, number];
  return hours * 60 + minutes;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/* --------------------------------- schemas --------------------------------- */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const isoTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

const slotBodySchema = z
  .object({
    branchId: z.string().min(1).nullish(),
    startsAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
    endsAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
    capacity: z.number().int().min(1).max(50).default(1),
    note: z.string().trim().max(500).nullish(),
  })
  .refine((body) => new Date(body.endsAt) > new Date(body.startsAt), {
    message: 'The slot must end after it starts',
    path: ['endsAt'],
  });

/**
 * Bulk generation — the way a diary is actually filled in. Nobody adds
 * "Tuesday 10:00, Tuesday 10:30, Tuesday 11:00…" by hand forty times.
 */
const generateSchema = z
  .object({
    branchId: z.string().min(1).nullish(),
    from: isoDate,
    to: isoDate,
    /** Sunday = 0. Empty means every day in the range. */
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    startTime: isoTime,
    endTime: isoTime,
    slotMinutes: z.number().int().min(5).max(480),
    capacity: z.number().int().min(1).max(50).default(1),
    /**
     * The client's UTC offset in minutes, as `-new Date().getTimezoneOffset()`
     * gives it (Yerevan = 240). Defaults to UTC so a script that omits it gets
     * something predictable rather than the server's incidental zone.
     */
    offsetMinutes: z.number().int().min(-840).max(840).default(0),
  })
  .refine((body) => body.to >= body.from, {
    message: 'The range must end on or after it starts',
    path: ['to'],
  })
  .refine((body) => minutesOfDay(body.endTime) > minutesOfDay(body.startTime), {
    message: 'The day must end after it starts',
    path: ['endTime'],
  });

const listQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  to: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  branchId: z.string().optional(),
  /** `true` drops the slots that are already full. */
  onlyOpen: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  take: z.coerce.number().int().min(1).max(500).default(200),
  skip: z.coerce.number().int().min(0).default(0),
});

/** A range of one day either side of "now" is rarely what anyone wants to see. */
const DEFAULT_WINDOW_DAYS = 30;
/** Ceiling on one generate call, so a fat-fingered range cannot fill the table. */
const MAX_GENERATED = 500;
const MAX_RANGE_DAYS = 92;

/* -------------------------------- staff CRUD -------------------------------- */

availabilityRouter.get(
  '/availability',
  requireAuth,
  requirePermission('availability', 'READ'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;

    const from = query.from ? new Date(query.from) : new Date();
    const to = query.to
      ? new Date(query.to)
      : new Date(from.getTime() + DEFAULT_WINDOW_DAYS * 86_400_000);

    const where: Prisma.AvailabilitySlotWhereInput = {
      startsAt: { gte: from, lte: to },
      ...(query.branchId ? { branchId: query.branchId } : {}),
    };

    const [slots, total] = await Promise.all([
      prisma.availabilitySlot.findMany({
        where,
        include: SLOT_INCLUDE,
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        take: query.take,
        skip: query.skip,
      }),
      prisma.availabilitySlot.count({ where }),
    ]);

    const holders = await countHolders(slots.map((slot) => slot.id));
    const items = slots
      .map((slot) => serializeSlot(slot, holders.get(slot.id) ?? 0))
      .filter((slot) => !query.onlyOpen || slot.open);

    res.json({ items, total, take: query.take, skip: query.skip });
  },
);

availabilityRouter.post(
  '/availability',
  requireAuth,
  requirePermission('availability', 'CREATE'),
  validateBody(slotBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof slotBodySchema>;
    await assertBranchExists(body.branchId);

    const slot = await prisma.availabilitySlot.create({
      data: {
        branchId: body.branchId ?? null,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        capacity: body.capacity,
        note: body.note ?? null,
      },
      include: SLOT_INCLUDE,
    });

    await audit(req.auth?.userId, 'availability.create', slot.id, { startsAt: body.startsAt });
    res.status(201).json(serializeSlot(slot, 0));
  },
);

/**
 * Fills a date range with slots. Idempotent by construction: a start time that
 * already has a slot at the same branch is skipped rather than duplicated, so
 * re-running a week after adding one weekday tops it up instead of doubling it.
 */
availabilityRouter.post(
  '/availability/generate',
  requireAuth,
  requirePermission('availability', 'CREATE'),
  validateBody(generateSchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof generateSchema>;
    await assertBranchExists(body.branchId);

    const spanDays = Math.round(
      (Date.parse(`${body.to}T00:00:00Z`) - Date.parse(`${body.from}T00:00:00Z`)) / 86_400_000,
    );
    if (spanDays > MAX_RANGE_DAYS) {
      throw badRequest(`Generate at most ${MAX_RANGE_DAYS} days at a time`);
    }

    const dayStart = minutesOfDay(body.startTime);
    const dayEnd = minutesOfDay(body.endTime);

    const candidates: { startsAt: Date; endsAt: Date }[] = [];
    for (let offset = 0; offset <= spanDays; offset += 1) {
      const date = addDays(body.from, offset);
      if (body.weekdays.length > 0 && !body.weekdays.includes(weekdayOf(date))) continue;

      // `+ slotMinutes <= dayEnd` rather than `< dayEnd`: a slot that would run
      // past closing is not generated at all, instead of being silently clipped.
      for (let at = dayStart; at + body.slotMinutes <= dayEnd; at += body.slotMinutes) {
        candidates.push({
          startsAt: utcFromLocal(date, at, body.offsetMinutes),
          endsAt: utcFromLocal(date, at + body.slotMinutes, body.offsetMinutes),
        });
      }
      if (candidates.length > MAX_GENERATED) {
        throw badRequest(
          `That range would create more than ${MAX_GENERATED} slots. Narrow it, or use a longer slot length.`,
        );
      }
    }

    if (candidates.length === 0) {
      res.status(201).json({ created: 0, skipped: 0, items: [] });
      return;
    }

    const branchId = body.branchId ?? null;
    const existing = await prisma.availabilitySlot.findMany({
      where: {
        branchId,
        startsAt: {
          gte: candidates[0]!.startsAt,
          lte: candidates[candidates.length - 1]!.startsAt,
        },
      },
      select: { startsAt: true },
    });
    const taken = new Set(existing.map((slot) => slot.startsAt.getTime()));

    const fresh = candidates.filter((slot) => !taken.has(slot.startsAt.getTime()));
    if (fresh.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: fresh.map((slot) => ({ ...slot, branchId, capacity: body.capacity })),
      });
    }

    await audit(req.auth?.userId, 'availability.generate', branchId ?? 'all', {
      from: body.from,
      to: body.to,
      created: fresh.length,
    });

    const items = await prisma.availabilitySlot.findMany({
      where: {
        branchId,
        startsAt: {
          gte: candidates[0]!.startsAt,
          lte: candidates[candidates.length - 1]!.startsAt,
        },
      },
      include: SLOT_INCLUDE,
      orderBy: { startsAt: 'asc' },
    });
    const holders = await countHolders(items.map((slot) => slot.id));

    res.status(201).json({
      created: fresh.length,
      skipped: candidates.length - fresh.length,
      items: items.map((slot) => serializeSlot(slot, holders.get(slot.id) ?? 0)),
    });
  },
);

/**
 * Edits a slot.
 *
 * Two things make this more than an `update`. Capacity cannot drop below what
 * is already booked into the window — that would leave it over-subscribed with
 * no way to tell which booking lost. And moving a slot moves the appointments
 * inside it, since `scheduledAt` is bound to `startsAt` whenever a slot is
 * held; leaving them behind would strand a booking at a time the diary no
 * longer offers.
 */
availabilityRouter.put(
  '/availability/:id',
  requireAuth,
  requirePermission('availability', 'UPDATE'),
  validateBody(slotBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const body = req.body as z.infer<typeof slotBodySchema>;
    await assertBranchExists(body.branchId);

    const startsAt = new Date(body.startsAt);

    const slot = await inSlotTransaction(async (tx) => {
      const current = await tx.availabilitySlot.findUnique({ where: { id } });
      if (!current) throw notFound('Availability slot not found');

      const held = await tx.booking.count({ where: occupiedBy(id) });
      if (held > body.capacity) {
        throw conflict(
          `${held} booking${held === 1 ? '' : 's'} already hold this slot — capacity cannot go below that.`,
        );
      }

      const updated = await tx.availabilitySlot.update({
        where: { id },
        data: {
          branchId: body.branchId ?? null,
          startsAt,
          endsAt: new Date(body.endsAt),
          capacity: body.capacity,
          note: body.note ?? null,
        },
        include: SLOT_INCLUDE,
      });

      if (current.startsAt.getTime() !== startsAt.getTime()) {
        await tx.booking.updateMany({ where: { slotId: id }, data: { scheduledAt: startsAt } });
      }

      return updated;
    });

    const holders = await countHolders([id]);
    await audit(req.auth?.userId, 'availability.update', id, { startsAt: body.startsAt });
    res.json(serializeSlot(slot, holders.get(id) ?? 0));
  },
);

/**
 * Removes a slot. Refused while bookings hold it: the appointments are the
 * point, and deleting the window out from under them would leave bookings
 * whose time nobody agreed to. Cancel or move them first.
 */
availabilityRouter.delete(
  '/availability/:id',
  requireAuth,
  requirePermission('availability', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.availabilitySlot.findUnique({ where: { id } }))) {
      throw notFound('Availability slot not found');
    }

    const held = await prisma.booking.count({ where: occupiedBy(id) });
    if (held > 0) {
      throw conflict(
        `${held} booking${held === 1 ? '' : 's'} still hold this slot. Cancel or move them first.`,
      );
    }

    await prisma.availabilitySlot.delete({ where: { id } });
    await audit(req.auth?.userId, 'availability.delete', id, {});
    res.status(204).end();
  },
);

/* --------------------------------- portal ---------------------------------- */

/**
 * What a partner may book into. Open slots only, future only, and no `take`
 * large enough to double as an export of the whole diary.
 *
 * Lives beside the slot logic rather than with the other `/portal` routes
 * because openness is defined here, and a second definition of "is this free"
 * is exactly the kind of duplicate that drifts.
 */
availabilityRouter.get('/portal/availability', requireAuth, requirePartner, async (_req, res) => {
  const now = new Date();
  const slots = await prisma.availabilitySlot.findMany({
    where: { startsAt: { gte: now, lte: new Date(now.getTime() + 60 * 86_400_000) } },
    include: SLOT_INCLUDE,
    orderBy: { startsAt: 'asc' },
    take: 500,
  });

  const holders = await countHolders(slots.map((slot) => slot.id));
  const items = slots
    .map((slot) => serializeSlot(slot, holders.get(slot.id) ?? 0))
    .filter((slot) => slot.open);

  res.json({ items, total: items.length });
});

/* --------------------------------- helpers --------------------------------- */

const SLOT_INCLUDE = {
  branch: { select: { id: true, name: true, city: true } },
} satisfies Prisma.AvailabilitySlotInclude;

type SlotRow = Prisma.AvailabilitySlotGetPayload<{ include: typeof SLOT_INCLUDE }>;

function serializeSlot(slot: SlotRow, bookedCount: number) {
  return {
    id: slot.id,
    branchId: slot.branchId,
    branch: slot.branch,
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
    capacity: slot.capacity,
    note: slot.note,
    bookedCount,
    /** Derived, not stored — see `services/availability.ts`. */
    open: bookedCount < slot.capacity,
    createdAt: slot.createdAt.toISOString(),
  };
}

async function assertBranchExists(branchId: string | null | undefined) {
  if (!branchId) return;
  if (!(await prisma.branch.findUnique({ where: { id: branchId } }))) {
    throw badRequest('Unknown branch');
  }
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'availability',
      resourceId,
      dataJson: data as never,
    },
  });
}
