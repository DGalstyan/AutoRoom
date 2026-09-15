import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { agent, createBooking, createPartner, createSlot, disconnect, resetData } from './helpers';

/**
 * The public "Become a dealer" flow — `references/pages.md` §5 S5.
 *
 * Two routes, one property between them: a visitor who is not a partner (and
 * has no login at all) can read the diary and book a meeting out of it, and the
 * meeting they booked is recorded as a `Lead` — not as a `Partner` with a
 * `Booking`, which is what would have to be invented to fit the authenticated
 * model. So the assertions below are as much about what is *not* created as
 * about what is.
 *
 * Dates are relative to now rather than pinned to a year: the public route only
 * publishes the next 60 days, and a 2027 fixture would be filtered out and
 * report "correctly hidden" for entirely the wrong reason.
 */
describe('become a dealer', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  const DAY = 86_400_000;
  const inDays = (days: number) => new Date(Date.now() + days * DAY);

  /** A seeded branch — the form's `🏢 AutoRoom գրասենյակում` choice. */
  async function branch() {
    const found = await prisma.branch.findFirst({ orderBy: { position: 'asc' } });
    if (!found) throw new Error('No branches — did the seed run?');
    return found;
  }

  /** A complete dealer submission, the way the form sends it. */
  function dealerBody(overrides: Record<string, unknown> = {}) {
    return {
      name: 'Պողոս Պողոսյան',
      phone: '+374 77 123456',
      email: 'poghos@example.com',
      company: 'Պողոս Ավտո ՍՊԸ',
      activityType: 'Ավտոսրահ',
      comment: 'Ամսական 5–10 մեքենա',
      meetingFormat: 'ONLINE',
      sourcePage: '/partners',
      sourceCta: 'dealers-become-a-partner',
      locale: 'hy',
      device: 'desktop',
      ...overrides,
    };
  }

  /* --------------------------- reading the diary --------------------------- */

  describe('GET /public/availability', () => {
    it('serves the diary to a caller with no account at all', async () => {
      const open = await createSlot({ startsAt: inDays(3) });

      const response = await agent().get('/public/availability');

      expect(response.status).toBe(200);
      expect(response.body.items.map((slot: { id: string }) => slot.id)).toEqual([open.id]);
    });

    it('lists a full window as taken rather than hiding it', async () => {
      // The form renders a fixed set of times and disables the taken ones, so
      // it needs to be told "taken" — an absence it would have to guess at.
      const partner = await createPartner();
      const full = await createSlot({ startsAt: inDays(2) });
      await createBooking(partner.id, { slotId: full.id, scheduledAt: full.startsAt });
      const free = await createSlot({ startsAt: inDays(3) });

      const response = await agent().get('/public/availability');

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.map((slot: { open: boolean }) => slot.open)).toEqual([
        false,
        true,
      ]);
      expect(response.body.items.map((slot: { id: string }) => slot.id)).toEqual([
        full.id,
        free.id,
      ]);
    });

    it('drops the taken ones on request', async () => {
      const partner = await createPartner();
      const full = await createSlot({ startsAt: inDays(2) });
      await createBooking(partner.id, { slotId: full.id, scheduledAt: full.startsAt });
      const free = await createSlot({ startsAt: inDays(3) });

      const response = await agent().get('/public/availability').query({ onlyOpen: 'true' });

      expect(response.body.items.map((slot: { id: string }) => slot.id)).toEqual([free.id]);
    });

    it('never publishes capacity or the staff note', async () => {
      await createSlot({ startsAt: inDays(3), capacity: 4, note: 'Internal: bay 2 only' });

      const [slot] = (await agent().get('/public/availability')).body.items;

      expect(Object.keys(slot as object).sort()).toEqual([
        'branch',
        'branchId',
        'endsAt',
        'id',
        'open',
        'startsAt',
      ]);
    });

    it('hides the past and anything past the 60-day horizon', async () => {
      const soon = await createSlot({ startsAt: inDays(5) });
      await createSlot({ startsAt: inDays(-5) });
      await createSlot({ startsAt: inDays(90) });

      // Asking for a year does not widen the window — the ceiling is the
      // server's, or this route would be an export of the whole diary.
      const response = await agent()
        .get('/public/availability')
        .query({ from: inDays(-30).toISOString(), to: inDays(365).toISOString() });

      expect(response.body.items.map((slot: { id: string }) => slot.id)).toEqual([soon.id]);
    });

    it('filters to one branch, and names it', async () => {
      const office = await branch();
      const here = await createSlot({ startsAt: inDays(3), branchId: office.id });
      await createSlot({ startsAt: inDays(4) });

      const response = await agent().get('/public/availability').query({ branchId: office.id });

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].id).toBe(here.id);
      expect(response.body.items[0].branch).toEqual({
        id: office.id,
        name: office.name,
        city: office.city,
      });
    });
  });

  /* ---------------------------- booking a meeting --------------------------- */

  describe('POST /leads with a meeting', () => {
    it('records the meeting on the lead and creates nothing else', async () => {
      const office = await branch();
      const slot = await createSlot({ startsAt: inDays(4), branchId: office.id });

      const response = await agent()
        .post('/leads')
        .send(
          dealerBody({
            meetingFormat: 'OFFICE',
            meetingBranchId: office.id,
            meetingSlotId: slot.id,
          }),
        );

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        company: 'Պողոս Ավտո ՍՊԸ',
        activityType: 'Ավտոսրահ',
        meetingFormat: 'OFFICE',
        meetingSlotId: slot.id,
        meetingBranchId: office.id,
        meetingAddress: null,
        sourceCta: 'dealers-become-a-partner',
        status: 'NEW',
      });
      expect(response.body.meetingAt).toBe(slot.startsAt.toISOString());

      // The whole point of the Lead-shaped model: an applicant is not yet a
      // partner, and nothing here pretends otherwise.
      expect(await prisma.partner.count()).toBe(0);
      expect(await prisma.booking.count()).toBe(0);
    });

    it('takes the time from the slot and ignores what the caller sent', async () => {
      const slot = await createSlot({ startsAt: inDays(6) });

      const response = await agent()
        .post('/leads')
        .send(
          dealerBody({
            meetingSlotId: slot.id,
            // Deliberately wrong: the diary and the meeting must not be able to
            // disagree about when it is.
            meetingAt: inDays(20).toISOString(),
          }),
        );

      expect(response.status).toBe(201);
      expect(response.body.meetingAt).toBe(slot.startsAt.toISOString());
    });

    it('accepts a time with no slot behind it', async () => {
      // The form offers a fixed daily set of times; one of them may be a window
      // nobody has generated a slot row for yet.
      const at = inDays(7);
      at.setUTCMinutes(30, 0, 0);

      const response = await agent()
        .post('/leads')
        .send(dealerBody({ meetingAt: at.toISOString() }));

      expect(response.status).toBe(201);
      expect(response.body.meetingAt).toBe(at.toISOString());
      expect(response.body.meetingSlotId).toBeNull();
    });

    it('does not consume the window it asked for', async () => {
      // A lead is an enquiry, not an appointment: occupancy stays a fact about
      // bookings, so a second visitor may still ask for the same time and a
      // manager decides between them.
      const slot = await createSlot({ startsAt: inDays(4) });

      await agent()
        .post('/leads')
        .send(dealerBody({ meetingSlotId: slot.id }))
        .expect(201);
      await agent()
        .post('/leads')
        .send(dealerBody({ meetingSlotId: slot.id }))
        .expect(201);

      const [listed] = (await agent().get('/public/availability')).body.items;
      expect(listed.open).toBe(true);
    });

    it('refuses a window a confirmed booking already fills', async () => {
      const partner = await createPartner();
      const slot = await createSlot({ startsAt: inDays(4) });
      await createBooking(partner.id, { slotId: slot.id, scheduledAt: slot.startsAt });

      const response = await agent()
        .post('/leads')
        .send(dealerBody({ meetingSlotId: slot.id }));

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(await prisma.lead.count()).toBe(0);
    });

    it('refuses a meeting in the past', async () => {
      const response = await agent()
        .post('/leads')
        .send(dealerBody({ meetingAt: inDays(-1).toISOString() }));

      expect(response.status).toBe(400);
    });

    it('refuses an unknown slot or branch', async () => {
      await agent()
        .post('/leads')
        .send(dealerBody({ meetingSlotId: 'no-such-slot' }))
        .expect(400);

      await agent()
        .post('/leads')
        .send(
          dealerBody({
            meetingFormat: 'OFFICE',
            meetingBranchId: 'no-such-branch',
            meetingAt: inDays(4).toISOString(),
          }),
        )
        .expect(400);
    });

    it('refuses a slot that belongs to another branch', async () => {
      const office = await branch();
      const elsewhere = await prisma.branch.findFirst({
        where: { id: { not: office.id } },
        orderBy: { position: 'asc' },
      });
      if (!elsewhere) throw new Error('The seed should leave more than one branch');

      const slot = await createSlot({ startsAt: inDays(4), branchId: elsewhere.id });

      const response = await agent()
        .post('/leads')
        .send(
          dealerBody({
            meetingFormat: 'OFFICE',
            meetingBranchId: office.id,
            meetingSlotId: slot.id,
          }),
        );

      expect(response.status).toBe(400);
    });
  });

  /* ------------------------- the all-or-nothing rule ------------------------ */

  describe('a half-booked meeting is refused', () => {
    /**
     * `meeting` is the whole meeting half of the body, so each case says
     * exactly what was sent — a key merged away or left `undefined` is how a
     * table-driven test ends up asserting something other than its own label.
     * A time here is always in the future, so a 400 is about the combination.
     */
    const cases: [string, Record<string, unknown>][] = [
      ['a format with no time', { meetingFormat: 'ONLINE' }],
      ['a time with no format', { meetingAt: 'FUTURE' }],
      [
        'an online meeting at a branch',
        { meetingFormat: 'ONLINE', meetingAt: 'FUTURE', meetingBranchId: 'anything' },
      ],
      ['an office meeting with no branch', { meetingFormat: 'OFFICE', meetingAt: 'FUTURE' }],
      ['an elsewhere meeting with no address', { meetingFormat: 'OTHER', meetingAt: 'FUTURE' }],
      [
        'an address on an office meeting',
        { meetingFormat: 'OFFICE', meetingAt: 'FUTURE', meetingAddress: 'Երևան, Արշակունյաց 25' },
      ],
    ];

    for (const [label, meeting] of cases) {
      it(`refuses ${label}`, async () => {
        const base = dealerBody();
        delete (base as Record<string, unknown>).meetingFormat;
        const body = {
          ...base,
          ...meeting,
          ...(meeting.meetingAt === 'FUTURE' ? { meetingAt: inDays(4).toISOString() } : {}),
        };

        const response = await agent().post('/leads').send(body);

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    }
  });

  /* ------------------------- the other widgets' leads ----------------------- */

  it('leaves every meeting column null for a lead that booked nothing', async () => {
    const response = await agent().post('/leads').send({
      name: 'Արամ',
      phone: '+374 77 000000',
      interest: 'china',
      sourcePage: '/',
      sourceCta: 'hero',
      locale: 'hy',
      device: 'mobile',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      company: null,
      activityType: null,
      meetingFormat: null,
      meetingAt: null,
      meetingSlotId: null,
      meetingBranchId: null,
      meetingAddress: null,
    });
  });
});
