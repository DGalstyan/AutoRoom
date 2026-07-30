import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { badRequest, conflict } from '../lib/errors';

/**
 * Slot occupancy — the one place that decides whether a window is open.
 *
 * Openness is derived, never stored: a slot is taken when the bookings holding
 * it reach its capacity. Storing a `taken` flag would mean a second write on
 * every booking create, cancel, delete and partner deletion, and any one of
 * those paths forgetting it leaves a window that looks full forever.
 */

/**
 * The statuses that occupy a slot. `CANCELLED` is the only one that does not —
 * cancelling is precisely how a window is handed back. `COMPLETED` still holds
 * it, because the appointment did happen and the time was genuinely used.
 */
export const OCCUPYING_STATUSES = [
  BookingStatus.REQUESTED,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
] as const;

/** `where` fragment for "bookings that occupy a slot". */
export const occupiedBy = (slotId: string): Prisma.BookingWhereInput => ({
  slotId,
  status: { in: [...OCCUPYING_STATUSES] },
});

export const SLOT_TAKEN_MESSAGE = 'That slot has just been taken. Pick another.';

/** Postgres serialization failure (SQLSTATE 40001), as Prisma reports it. */
export function isSerializationFailure(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
}

/** Attempts before giving up on a contended slot. */
const MAX_ATTEMPTS = 3;

/**
 * Runs `fn` under `Serializable`, retrying if the database makes it start over.
 *
 * Booking a slot is read-then-write — count the holders, then insert — which
 * `ReadCommitted` would let two requests do concurrently, both seeing capacity
 * to spare and both inserting. Serializable is what makes the count a promise
 * rather than a guess.
 *
 * The retry matters for correctness, not just robustness. A serialization
 * failure means "your snapshot is stale, run it again" — *not* "the slot is
 * full". Two bookings into a capacity-2 slot can collide at the database level
 * even though both should succeed, and answering the loser with "that slot has
 * just been taken" would be a plain lie about a window that still has room. So
 * the transaction is replayed, and the honest 409 comes from `claimSlot`
 * re-counting and finding it genuinely full. Only a slot contended hard enough
 * to fail every attempt falls through to the generic message.
 */
export async function inSlotTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: 'Serializable',
        // Above Prisma's 5s default: the diary reads are cheap, but a loaded
        // database plus a retry should not turn a valid booking into an error.
        timeout: 10_000,
        maxWait: 5_000,
      });
    } catch (error) {
      if (!isSerializationFailure(error)) throw error;
      if (attempt >= MAX_ATTEMPTS) throw conflict(SLOT_TAKEN_MESSAGE);
    }
  }
}

/**
 * Claims a place in a slot, or explains why it cannot be claimed.
 *
 * `excludeBookingId` is what makes re-saving an existing booking work: a
 * booking already holding the slot must not be counted as a rival for its own
 * place, or every edit of a capacity-1 appointment would fail as "full".
 *
 * Returns the slot so callers can bind `scheduledAt` to it.
 */
export async function claimSlot(
  tx: Prisma.TransactionClient,
  slotId: string,
  excludeBookingId?: string,
) {
  const slot = await tx.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot) throw badRequest('Unknown availability slot');

  const held = await tx.booking.count({
    where: {
      ...occupiedBy(slotId),
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });

  if (held >= slot.capacity) throw conflict(SLOT_TAKEN_MESSAGE);
  return slot;
}

/**
 * Resolves the slot a booking is being written into, claiming a place in it
 * when the booking's status actually occupies one.
 *
 * A cancelled booking may still point at a slot — that is its history, and the
 * portal shows "you cancelled the 10:00" rather than a booking with no time —
 * but it must not consume capacity, so it reads the slot without claiming. The
 * same rule run backwards is what lets a cancelled booking be reinstated only
 * if its old window is still free.
 */
export async function resolveSlotForBooking(
  tx: Prisma.TransactionClient,
  slotId: string,
  status: BookingStatus,
  excludeBookingId?: string,
) {
  if (status === BookingStatus.CANCELLED) {
    const slot = await tx.availabilitySlot.findUnique({ where: { id: slotId } });
    if (!slot) throw badRequest('Unknown availability slot');
    return slot;
  }
  return claimSlot(tx, slotId, excludeBookingId);
}

/**
 * How many bookings hold each of these slots, as a map.
 *
 * One `groupBy` for the whole page rather than a count per row — a month of
 * half-hour slots is several hundred rows, and a query each is how a calendar
 * screen ends up slower than the diary it replaced.
 */
export async function countHolders(slotIds: string[]): Promise<Map<string, number>> {
  if (slotIds.length === 0) return new Map();

  const rows = await prisma.booking.groupBy({
    by: ['slotId'],
    where: { slotId: { in: slotIds }, status: { in: [...OCCUPYING_STATUSES] } },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.slotId!, row._count._all]));
}
