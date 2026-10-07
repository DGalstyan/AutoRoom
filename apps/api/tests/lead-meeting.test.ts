import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { setSmsTransport, type Sms } from '../src/lib/sms';
import { agent, auth, createSlot, createUser, disconnect, resetData } from './helpers';

/** Staff handling a dealer's meeting request: confirm, reschedule, cancel, complete. */
describe('PATCH /leads/:id/meeting', () => {
  const sent: Sms[] = [];
  beforeEach(async () => {
    await resetData();
    sent.length = 0;
    setSmsTransport({ send: async (sms) => void sent.push(sms) });
  });
  afterAll(disconnect);

  const DAY = 86_400_000;

  async function meetingLead(overrides: Record<string, unknown> = {}) {
    const slot = await createSlot();
    const response = await agent()
      .post('/leads')
      .send({
        name: 'Armen',
        phone: '094 077757',
        company: 'Auto LLC',
        meetingFormat: 'ONLINE',
        meetingSlotId: slot.id,
        sourcePage: '/partners',
        sourceCta: 'partners-booking',
        locale: 'en',
        device: 'desktop',
        ...overrides,
      });
    return response.body as { id: string; meetingAt: string };
  }

  const act = (token: string, id: string, body: Record<string, unknown>) =>
    agent().patch(`/leads/${id}/meeting`).set(auth(token)).send(body);

  it('a new meeting request starts PENDING', async () => {
    const lead = await meetingLead();
    const row = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(row.meetingStatus).toBe('PENDING');
  });

  it('confirming marks it CONFIRMED, stamps the time and texts the dealer', async () => {
    const { token } = await createUser('super_admin');
    const lead = await meetingLead();
    const response = await act(token, lead.id, {
      action: 'confirm',
      note: 'See you at the office.',
    });
    expect(response.status).toBe(200);
    expect(response.body.lead).toMatchObject({ meetingStatus: 'CONFIRMED' });
    expect(response.body.lead.meetingConfirmedAt).not.toBeNull();
    expect(response.body.notified).toBe('sent');
    expect(sent[0]!.to).toBe('+37494077757');
    expect(sent[0]!.text).toContain('confirmed');
    expect(sent[0]!.text).toContain('See you at the office.');
  });

  it('rescheduling moves the time, remembers the old one and re-confirms', async () => {
    const { token } = await createUser('super_admin');
    const lead = await meetingLead();
    const newTime = new Date(Date.now() + 9 * DAY).toISOString();
    const response = await act(token, lead.id, { action: 'reschedule', meetingAt: newTime });
    expect(response.status).toBe(200);
    expect(response.body.lead.meetingAt).toBe(newTime);
    expect(response.body.lead.meetingPreviousAt).toBe(lead.meetingAt);
    expect(response.body.lead.meetingStatus).toBe('CONFIRMED');
    expect(sent[0]!.text).toContain('moved');
  });

  it('rescheduling needs a time, and it must be in the future', async () => {
    const { token } = await createUser('super_admin');
    const lead = await meetingLead();
    expect((await act(token, lead.id, { action: 'reschedule' })).status).toBe(400);
    const past = new Date(Date.now() - DAY).toISOString();
    expect((await act(token, lead.id, { action: 'reschedule', meetingAt: past })).status).toBe(400);
  });

  it('cancelling marks it CANCELLED; only a reschedule brings it back', async () => {
    const { token } = await createUser('super_admin');
    const lead = await meetingLead();
    const cancelled = await act(token, lead.id, { action: 'cancel' });
    expect(cancelled.body.lead.meetingStatus).toBe('CANCELLED');
    expect(sent[0]!.text).toContain('cancelled');

    expect((await act(token, lead.id, { action: 'confirm' })).status).toBe(400);
    const back = await act(token, lead.id, {
      action: 'reschedule',
      meetingAt: new Date(Date.now() + 5 * DAY).toISOString(),
    });
    expect(back.body.lead.meetingStatus).toBe('CONFIRMED');
  });

  it('completing closes it out, with no text', async () => {
    const { token } = await createUser('super_admin');
    const lead = await meetingLead();
    const response = await act(token, lead.id, { action: 'complete' });
    expect(response.body.lead.meetingStatus).toBe('COMPLETED');
    expect(response.body.notified).toBe('skipped');
    expect(sent).toHaveLength(0);
    expect((await act(token, lead.id, { action: 'cancel' })).status).toBe(400);
  });

  it('notify:false changes the meeting without texting', async () => {
    const { token } = await createUser('super_admin');
    const lead = await meetingLead();
    const response = await act(token, lead.id, { action: 'confirm', notify: false });
    expect(response.body.notified).toBe('skipped');
    expect(sent).toHaveLength(0);
  });

  it('a gateway outage does not undo the decision', async () => {
    const { token } = await createUser('super_admin');
    const lead = await meetingLead();
    setSmsTransport({
      send: async () => {
        throw new Error('down');
      },
    });
    const response = await act(token, lead.id, { action: 'confirm' });
    expect(response.status).toBe(200);
    expect(response.body.notified).toBe('failed');
    expect(response.body.lead.meetingStatus).toBe('CONFIRMED');
  });

  it('refuses a lead that never asked for a meeting', async () => {
    const { token } = await createUser('super_admin');
    const plain = await agent().post('/leads').send({
      name: 'Anna',
      phone: '094077757',
      sourcePage: '/',
      sourceCta: 'header-cta',
      locale: 'hy',
      device: 'mobile',
    });
    expect((await act(token, plain.body.id, { action: 'confirm' })).status).toBe(400);
  });

  it('is staff-only', async () => {
    const lead = await meetingLead();
    expect(
      (await agent().patch(`/leads/${lead.id}/meeting`).send({ action: 'confirm' })).status,
    ).toBe(401);
    const { token } = await createUser('partner');
    expect((await act(token, lead.id, { action: 'confirm' })).status).toBe(403);
  });

  it('GET /leads?meeting=true lists only meeting requests, soonest first; meetingStatus narrows', async () => {
    const { token } = await createUser('super_admin');
    await agent().post('/leads').send({
      name: 'Anna',
      phone: '094077757',
      sourcePage: '/',
      sourceCta: 'header-cta',
      locale: 'hy',
      device: 'mobile',
    });
    const a = await meetingLead();
    await meetingLead({ phone: '077 111222' });
    await act(token, a.id, { action: 'confirm', notify: false });

    const all = await agent().get('/leads?meeting=true').set(auth(token));
    expect(all.body.total).toBe(2);
    const times = all.body.items.map((l: { meetingAt: string }) => l.meetingAt);
    expect([...times].sort()).toEqual(times);

    const confirmed = await agent().get('/leads?meetingStatus=CONFIRMED').set(auth(token));
    expect(confirmed.body.total).toBe(1);
  });
});
