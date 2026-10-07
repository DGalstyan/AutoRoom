import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { setSmsTransport, type Sms } from '../src/lib/sms';
import { normalizePhone } from '../src/services/phoneVerification';
import { agent, createSlot, disconnect, resetData } from './helpers';

/** The SMS-code check in front of the "Become a dealer" meeting request. */
describe('phone verification', () => {
  const sent: Sms[] = [];
  beforeEach(async () => {
    await resetData();
    sent.length = 0;
    setSmsTransport({ send: async (sms) => void sent.push(sms) });
  });
  afterEach(() => {
    env.PHONE_VERIFICATION = 'off';
  });
  afterAll(disconnect);

  const lastCode = () => /(\d{6})/.exec(sent[sent.length - 1]?.text ?? '')?.[1] ?? '';
  const start = (phone = '094077757') => agent().post('/phone-verifications').send({ phone });
  const confirm = (phone: string, code: string) =>
    agent().post('/phone-verifications/confirm').send({ phone, code });

  it('normalises the ways a phone number gets typed', () => {
    for (const raw of [
      '094 077757',
      '+374 94 077757',
      '37494077757',
      '(94) 07-77-57',
      '0037494077757',
    ]) {
      expect(normalizePhone(raw)).toBe('+37494077757');
    }
    expect(() => normalizePhone('abc')).toThrow();
  });

  it('texts a 6-digit code, then trades the right code for a token', async () => {
    expect((await start('094 077757')).status).toBe(202);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe('+37494077757');

    const ok = await confirm('+37494077757', lastCode());
    expect(ok.status).toBe(200);
    expect(typeof ok.body.token).toBe('string');
  });

  it('never stores the code, only a hash', async () => {
    await start();
    const row = await prisma.phoneVerification.findFirstOrThrow();
    expect(row.codeHash).not.toContain(lastCode());
    expect(row.codeHash).toHaveLength(64);
  });

  it('rejects a wrong code and locks the code after too many guesses', async () => {
    await start();
    const real = lastCode();
    const wrong = real === '000000' ? '111111' : '000000';
    for (let i = 0; i < env.PHONE_VERIFICATION_MAX_ATTEMPTS; i++) {
      expect((await confirm('094077757', wrong)).status).toBe(400);
    }
    // Even the right code no longer works: the guess budget is spent.
    expect((await confirm('094077757', real)).status).toBe(400);
  });

  it('an expired code does not verify', async () => {
    await start();
    await prisma.phoneVerification.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await confirm('094077757', lastCode())).status).toBe(400);
  });

  it('a code is single use', async () => {
    await start();
    const code = lastCode();
    expect((await confirm('094077757', code)).status).toBe(200);
    expect((await confirm('094077757', code)).status).toBe(400);
  });

  it('caps how many codes one phone can be sent', async () => {
    for (let i = 0; i < env.PHONE_VERIFICATION_MAX_SENDS; i++) {
      expect((await start()).status).toBe(202);
    }
    expect((await start()).status).toBe(429);
  });

  it('reports 503 and keeps no dead record when the gateway fails', async () => {
    setSmsTransport({
      send: async () => {
        throw new Error('gateway down');
      },
    });
    expect((await start()).status).toBe(503);
    expect(await prisma.phoneVerification.count()).toBe(0);
  });

  describe('as a gate on the dealer meeting request', () => {
    const lead = async (extra: Record<string, unknown> = {}) => {
      const slot = await createSlot();
      return agent()
        .post('/leads')
        .send({
          name: 'Armen',
          phone: '094 077757',
          company: 'Auto LLC',
          meetingFormat: 'ONLINE',
          meetingSlotId: slot.id,
          sourcePage: '/partners',
          sourceCta: 'partners-booking',
          locale: 'hy',
          device: 'desktop',
          ...extra,
        });
    };

    it('is not enforced while PHONE_VERIFICATION is off', async () => {
      const response = await lead();
      expect(response.status).toBe(201);
      expect(response.body.phoneVerifiedAt).toBeNull();
    });

    it('refuses a meeting request without proof once required', async () => {
      env.PHONE_VERIFICATION = 'required';
      const response = await lead();
      expect(response.status).toBe(400);
      expect(response.body.error.details).toMatchObject({ code: 'PHONE_NOT_VERIFIED' });
      expect(await prisma.lead.count()).toBe(0);
    });

    it('accepts the proof for the same number, and records that it was verified', async () => {
      env.PHONE_VERIFICATION = 'required';
      await start('094 077757');
      const { body } = await confirm('094 077757', lastCode());
      const response = await lead({ phoneVerificationToken: body.token });
      expect(response.status).toBe(201);
      expect(response.body.phoneVerifiedAt).not.toBeNull();
      expect(response.body.meetingStatus).toBe('PENDING');
    });

    it('refuses a proof issued for a different number', async () => {
      env.PHONE_VERIFICATION = 'required';
      await start('077 111222');
      const { body } = await confirm('077 111222', lastCode());
      expect((await lead({ phoneVerificationToken: body.token })).status).toBe(400);
    });

    it('leaves the other lead widgets alone', async () => {
      env.PHONE_VERIFICATION = 'required';
      const response = await agent().post('/leads').send({
        name: 'Anna',
        phone: '094077757',
        sourcePage: '/',
        sourceCta: 'header-cta',
        locale: 'hy',
        device: 'mobile',
      });
      expect(response.status).toBe(201);
    });
  });
});
