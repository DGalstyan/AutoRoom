import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  agent,
  auth,
  createPartner,
  createPartnerWithAccount,
  createSlot,
  createUser,
  disconnect,
  resetData,
} from './helpers';

/**
 * The diary, and the rule that ties a booking to it.
 *
 * The property under test throughout is that "open" is a *derived* fact —
 * bookings against capacity — rather than a flag somebody has to remember to
 * flip. So the assertions are about what the slot list says after a booking is
 * made, cancelled, deleted or moved, never about a stored column.
 */
describe('availability', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  const WINDOW = { from: '2027-01-01T00:00:00.000Z', to: '2027-12-31T00:00:00.000Z' };

  async function staff() {
    return createUser('admin');
  }

  /** The slot list as staff see it, across a window wide enough for the fixtures. */
  async function listSlots(token: string, query: Record<string, string> = {}) {
    const response = await agent()
      .get('/availability')
      .query({ ...WINDOW, ...query })
      .set(auth(token));
    expect(response.status).toBe(200);
    return response.body.items as {
      id: string;
      open: boolean;
      bookedCount: number;
      capacity: number;
      startsAt: string;
    }[];
  }

  describe('a booking ties to a slot', () => {
    it('takes its time from the slot and marks the slot taken', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot({ startsAt: new Date('2027-03-01T10:00:00.000Z') });

      const response = await agent()
        .post('/bookings')
        .set(auth(token))
        // A deliberately wrong `scheduledAt`: the slot must win, or the diary
        // and the appointment can disagree about when it is.
        .send({
          partnerId: partner.id,
          slotId: slot.id,
          scheduledAt: '2027-06-06T06:06:00.000Z',
          status: 'REQUESTED',
        });

      expect(response.status).toBe(201);
      expect(response.body.slotId).toBe(slot.id);
      expect(response.body.scheduledAt).toBe('2027-03-01T10:00:00.000Z');
      expect(response.body.slot.startsAt).toBe('2027-03-01T10:00:00.000Z');

      const [listed] = await listSlots(token);
      expect(listed!.bookedCount).toBe(1);
      expect(listed!.open).toBe(false);
    });

    it('refuses a second booking into a full slot', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot();

      const first = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'CONFIRMED' });
      expect(first.status).toBe(201);

      const second = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'REQUESTED' });

      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('CONFLICT');
    });

    it('fills a slot up to its capacity and no further', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot({ capacity: 2 });

      for (const status of ['REQUESTED', 'CONFIRMED']) {
        const response = await agent()
          .post('/bookings')
          .set(auth(token))
          .send({ partnerId: partner.id, slotId: slot.id, status });
        expect(response.status).toBe(201);
      }

      const [listed] = await listSlots(token);
      expect(listed!.bookedCount).toBe(2);
      expect(listed!.open).toBe(false);

      const third = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'REQUESTED' });
      expect(third.status).toBe(409);
    });

    it('rejects a booking with neither a slot nor a time', async () => {
      const { token } = await staff();
      const partner = await createPartner();

      const response = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, status: 'REQUESTED' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('still allows an appointment written straight into the calendar', async () => {
      const { token } = await staff();
      const partner = await createPartner();

      const response = await agent().post('/bookings').set(auth(token)).send({
        partnerId: partner.id,
        scheduledAt: '2027-04-02T09:00:00.000Z',
        status: 'REQUESTED',
      });

      expect(response.status).toBe(201);
      expect(response.body.slotId).toBeNull();
      expect(response.body.scheduledAt).toBe('2027-04-02T09:00:00.000Z');
    });

    it('re-saving a booking does not treat it as its own rival', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot();

      const created = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'REQUESTED' });
      expect(created.status).toBe(201);

      const saved = await agent().put(`/bookings/${created.body.id}`).set(auth(token)).send({
        partnerId: partner.id,
        slotId: slot.id,
        status: 'CONFIRMED',
        customerName: 'Aram',
      });

      expect(saved.status).toBe(200);
      expect(saved.body.status).toBe('CONFIRMED');
    });
  });

  /**
   * The read-then-write in `claimSlot` is only safe because the transaction is
   * Serializable *and* replayed when Postgres makes it start over. These two
   * cases pin both halves: without the isolation the first over-books, and
   * without the retry the second wrongly rejects a booking there was room for.
   */
  describe('simultaneous claims', () => {
    function book(token: string, partnerId: string, slotId: string) {
      return agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId, slotId, status: 'CONFIRMED' });
    }

    it('lets exactly one of two simultaneous bookings take a capacity-1 slot', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot();

      const results = await Promise.all([
        book(token, partner.id, slot.id),
        book(token, partner.id, slot.id),
      ]);

      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect(results.filter((r) => r.status === 409)).toHaveLength(1);
      expect((await listSlots(token))[0]!.bookedCount).toBe(1);
    });

    it('lets both simultaneous bookings into a capacity-2 slot', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot({ capacity: 2 });

      const results = await Promise.all([
        book(token, partner.id, slot.id),
        book(token, partner.id, slot.id),
      ]);

      // Both belong in the window. A serialization failure here means "retry",
      // not "full", and answering either caller with 409 would be wrong.
      expect(results.map((r) => r.status)).toEqual([201, 201]);
      expect((await listSlots(token))[0]!.bookedCount).toBe(2);
    });
  });

  describe('cancelling frees the slot', () => {
    it('reopens the slot when the booking is cancelled', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot();

      const created = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'CONFIRMED' });

      expect((await listSlots(token))[0]!.open).toBe(false);

      const cancelled = await agent()
        .put(`/bookings/${created.body.id}`)
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'CANCELLED' });
      expect(cancelled.status).toBe(200);

      const [listed] = await listSlots(token);
      expect(listed!.bookedCount).toBe(0);
      expect(listed!.open).toBe(true);

      // ...and the freed place can genuinely be taken by someone else.
      const next = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'REQUESTED' });
      expect(next.status).toBe(201);
    });

    it('reopens the slot when the booking is deleted', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot();

      const created = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'CONFIRMED' });

      await agent().delete(`/bookings/${created.body.id}`).set(auth(token)).expect(204);

      expect((await listSlots(token))[0]!.open).toBe(true);
    });

    it('keeps a completed appointment holding its slot', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot();

      await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'COMPLETED' })
        .expect(201);

      expect((await listSlots(token))[0]!.open).toBe(false);
    });
  });

  describe('availability edits change the open slots', () => {
    it('adds slots for a generated range and skips ones already there', async () => {
      const { token } = await staff();

      const body = {
        from: '2027-05-03',
        to: '2027-05-04',
        startTime: '10:00',
        endTime: '12:00',
        slotMinutes: 60,
        offsetMinutes: 0,
      };

      const first = await agent().post('/availability/generate').set(auth(token)).send(body);
      expect(first.status).toBe(201);
      // Two days × two hours at hourly slots.
      expect(first.body.created).toBe(4);
      expect(first.body.skipped).toBe(0);

      const again = await agent().post('/availability/generate').set(auth(token)).send(body);
      expect(again.status).toBe(201);
      expect(again.body.created).toBe(0);
      expect(again.body.skipped).toBe(4);

      expect(await prisma.availabilitySlot.count()).toBe(4);
    });

    it('honours the weekday filter and the caller time zone', async () => {
      const { token } = await staff();

      // 2027-05-03 is a Monday; 2027-05-04 a Tuesday. Ask for Mondays only.
      const response = await agent()
        .post('/availability/generate')
        .set(auth(token))
        .send({
          from: '2027-05-03',
          to: '2027-05-09',
          weekdays: [1],
          startTime: '10:00',
          endTime: '11:00',
          slotMinutes: 60,
          // Yerevan. 10:00 local is 06:00Z — the point of sending the offset.
          offsetMinutes: 240,
        });

      expect(response.status).toBe(201);
      expect(response.body.created).toBe(1);
      expect(response.body.items[0].startsAt).toBe('2027-05-03T06:00:00.000Z');
    });

    it('raising capacity reopens a full slot', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot({ capacity: 1 });

      await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'CONFIRMED' })
        .expect(201);
      expect((await listSlots(token))[0]!.open).toBe(false);

      const widened = await agent().put(`/availability/${slot.id}`).set(auth(token)).send({
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        capacity: 2,
      });
      expect(widened.status).toBe(200);

      const [listed] = await listSlots(token);
      expect(listed!.capacity).toBe(2);
      expect(listed!.open).toBe(true);
    });

    it('refuses to cut capacity below what is already booked', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot({ capacity: 2 });

      for (const status of ['REQUESTED', 'CONFIRMED']) {
        await agent()
          .post('/bookings')
          .set(auth(token))
          .send({ partnerId: partner.id, slotId: slot.id, status })
          .expect(201);
      }

      const response = await agent().put(`/availability/${slot.id}`).set(auth(token)).send({
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        capacity: 1,
      });

      expect(response.status).toBe(409);
    });

    it('moving a slot moves the appointments inside it', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot({ startsAt: new Date('2027-03-01T10:00:00.000Z') });

      const created = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'CONFIRMED' });

      const moved = await agent().put(`/availability/${slot.id}`).set(auth(token)).send({
        startsAt: '2027-03-01T14:00:00.000Z',
        endsAt: '2027-03-01T14:30:00.000Z',
        capacity: 1,
      });
      expect(moved.status).toBe(200);

      const booking = await prisma.booking.findUniqueOrThrow({ where: { id: created.body.id } });
      expect(booking.scheduledAt.toISOString()).toBe('2027-03-01T14:00:00.000Z');
    });

    it('refuses to delete a slot bookings still hold, and allows it once freed', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const slot = await createSlot();

      const created = await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: slot.id, status: 'CONFIRMED' });

      const blocked = await agent().delete(`/availability/${slot.id}`).set(auth(token));
      expect(blocked.status).toBe(409);

      await agent().delete(`/bookings/${created.body.id}`).set(auth(token)).expect(204);
      await agent().delete(`/availability/${slot.id}`).set(auth(token)).expect(204);
    });

    it('filters to open slots on request', async () => {
      const { token } = await staff();
      const partner = await createPartner();
      const full = await createSlot({ startsAt: new Date('2027-03-01T10:00:00.000Z') });
      const free = await createSlot({ startsAt: new Date('2027-03-01T11:00:00.000Z') });

      await agent()
        .post('/bookings')
        .set(auth(token))
        .send({ partnerId: partner.id, slotId: full.id, status: 'CONFIRMED' })
        .expect(201);

      const open = await listSlots(token, { onlyOpen: 'true' });
      expect(open.map((slot) => slot.id)).toEqual([free.id]);
    });
  });

  describe('permissions and portal scoping', () => {
    it('refuses a role without the availability grant', async () => {
      const { token } = await createUser('content_editor');

      await agent().get('/availability').query(WINDOW).set(auth(token)).expect(403);
      await agent()
        .post('/availability')
        .set(auth(token))
        .send({ startsAt: '2027-03-01T10:00:00.000Z', endsAt: '2027-03-01T10:30:00.000Z' })
        .expect(403);
    });

    it('refuses anonymous callers', async () => {
      await agent().get('/availability').query(WINDOW).expect(401);
    });

    it('shows a partner only open, future slots', async () => {
      const { token: staffToken } = await staff();
      const { partner, token } = await createPartnerWithAccount();

      // Relative to now, not a fixed year: the portal only offers the next 60
      // days, so a fixture pinned to 2027 would fall outside the window and
      // report "correctly hidden" for the wrong reason.
      const day = 86_400_000;
      const open = await createSlot({ startsAt: new Date(Date.now() + 3 * day) });
      const full = await createSlot({ startsAt: new Date(Date.now() + 2 * day) });
      // Already happened, so it is not somewhere anyone can still book.
      await createSlot({ startsAt: new Date(Date.now() - 30 * day) });

      await agent()
        .post('/bookings')
        .set(auth(staffToken))
        .send({ partnerId: partner.id, slotId: full.id, status: 'CONFIRMED' })
        .expect(201);

      const response = await agent().get('/portal/availability').set(auth(token));

      expect(response.status).toBe(200);
      expect(response.body.items.map((slot: { id: string }) => slot.id)).toEqual([open.id]);
    });

    it('keeps the staff diary out of a partner’s reach', async () => {
      const { token } = await createPartnerWithAccount();
      await agent().get('/availability').query(WINDOW).set(auth(token)).expect(403);
    });
  });
});
