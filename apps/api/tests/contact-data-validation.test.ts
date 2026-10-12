import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { parsePhone, parseTelegram } from '../src/client/messengers';
import { agent, auth, createUser, disconnect, resetData } from './helpers';

describe('messenger numbers', () => {
  it('rejects an Armenian number with too few digits (the "374945544" typo)', () => {
    expect(parsePhone('374945544').ok).toBe(false);
    expect(parsePhone('+374 94 5544').ok).toBe(false);
  });
  it('rejects an Armenian number with too many digits', () => {
    expect(parsePhone('+374 94 12345678').ok).toBe(false);
  });
  it('accepts a full Armenian number in every usual form', () => {
    for (const input of ['+374 94 123456', '37494123456', '0037494123456', '094123456']) {
      expect(parsePhone(input)).toEqual({ ok: true, value: '37494123456' });
    }
  });
  it('still accepts a full number from another country', () => {
    expect(parsePhone('+1 415 555 2671')).toEqual({ ok: true, value: '14155552671' });
  });
  it('requires a real telegram username', () => {
    expect(parseTelegram('@abc').ok).toBe(false);
    expect(parseTelegram('t.me/autoroom_am')).toEqual({ ok: true, value: 'autoroom_am' });
  });
});

describe('social links and lead email', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  const put = async (links: Record<string, string | null>) => {
    const { token } = await createUser('admin');
    return agent()
      .put('/settings/contacts.social')
      .set(auth(token))
      .send({ facebook: null, instagram: null, tiktok: null, linkedin: null, ...links });
  };

  it('rejects links that only open the site’s home page', async () => {
    for (const [key, url] of [
      ['instagram', 'https://www.instagram.com/'],
      ['facebook', 'https://facebook.com'],
      ['tiktok', 'https://www.tiktok.com/'],
      ['linkedin', 'https://www.linkedin.com'],
    ] as const) {
      expect((await put({ [key]: url })).status).toBe(400);
    }
  });
  it('rejects a link to the wrong site', async () => {
    expect((await put({ instagram: 'https://www.facebook.com/autoroom' })).status).toBe(400);
  });
  it('accepts AutoRoom’s own pages', async () => {
    const res = await put({
      instagram: 'https://www.instagram.com/autoroom.am/',
      facebook: 'https://www.facebook.com/autoroom.am',
      tiktok: 'https://www.tiktok.com/@autoroom.am',
      linkedin: 'https://www.linkedin.com/company/autoroom',
    });
    expect(res.status).toBe(200);
  });

  const lead = {
    name: 'Ani',
    phone: '+374 94 123456',
    sourcePage: '/contact',
    sourceCta: 'contact-s1-form',
    locale: 'hy',
    device: 'mobile',
  };
  it('rejects an email that is not an address, and accepts none or a real one', async () => {
    expect(
      (
        await agent()
          .post('/leads')
          .send({ ...lead, email: 'not-an-email' })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent()
          .post('/leads')
          .send({ ...lead, email: 'a@b' })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent()
          .post('/leads')
          .send({ ...lead, email: 'ani@example.com' })
      ).status,
    ).toBe(201);
    expect(
      (
        await agent()
          .post('/leads')
          .send({ ...lead, email: '' })
      ).status,
    ).toBe(201);
    expect((await agent().post('/leads').send(lead)).status).toBe(201);
  });
  it('limits the topic and comment length', async () => {
    expect(
      (
        await agent()
          .post('/leads')
          .send({ ...lead, topic: 'x'.repeat(121) })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent()
          .post('/leads')
          .send({ ...lead, comment: 'x'.repeat(4001) })
      ).status,
    ).toBe(400);
  });
});
