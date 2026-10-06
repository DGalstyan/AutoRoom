import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  buildMessengerLinks,
  parsePhone,
  parseTelegram,
  withPrefilledText,
} from '../src/client/messengers';
import { agent, auth, createUser, disconnect, resetData } from './helpers';

describe('messenger parsing', () => {
  it.each([
    ['+374 93 88 28 18', '37493882818'],
    ['0037493882818', '37493882818'],
    ['093-88-28-18', '37493882818'],
    ['(374) 93 882818', '37493882818'],
    ['https://wa.me/37493882818', '37493882818'],
    ['wa.me/37493882818?text=hi', '37493882818'],
    ['https://api.whatsapp.com/send?phone=37493882818', '37493882818'],
  ])('phone %s → %s', (input, digits) => {
    expect(parsePhone(input)).toEqual({ ok: true, value: digits });
  });

  it.each(['', 'call me', '123', '+0 123456789', '12345678901234567', 'abc12345678'])(
    'rejects phone %j',
    (input) => {
      expect(parsePhone(input).ok).toBe(false);
    },
  );

  it.each([
    ['@autoroom_am', 'autoroom_am'],
    ['autoroom_am', 'autoroom_am'],
    ['t.me/autoroom_am', 'autoroom_am'],
    ['https://t.me/autoroom_am?start=1', 'autoroom_am'],
    ['https://telegram.me/AutoRoom', 'AutoRoom'],
  ])('telegram %s → %s', (input, username) => {
    expect(parseTelegram(input)).toEqual({ ok: true, value: username });
  });

  it.each(['', '@abc', '1autoroom', 'auto room', 'a'.repeat(33), '@авто_рум'])(
    'rejects telegram %j',
    (input) => {
      expect(parseTelegram(input).ok).toBe(false);
    },
  );
});

describe('deep links', () => {
  const links = buildMessengerLinks({
    whatsapp: '37493882818',
    viber: '37493882818',
    telegram: 'autoroom_am',
  });

  it('builds the canonical link for each messenger', () => {
    expect(links).toEqual({
      whatsapp: 'https://wa.me/37493882818',
      viber: 'viber://chat?number=%2B37493882818',
      telegram: 'https://t.me/autoroom_am',
    });
  });

  it('an unset handle has no link', () => {
    expect(buildMessengerLinks({ whatsapp: null, viber: null, telegram: null })).toEqual({
      whatsapp: null,
      viber: null,
      telegram: null,
    });
  });

  it('prefills text for WhatsApp only', () => {
    expect(withPrefilledText('whatsapp', links.whatsapp!, 'Hi Anna & co')).toBe(
      'https://wa.me/37493882818?text=Hi%20Anna%20%26%20co',
    );
    expect(withPrefilledText('viber', links.viber!, 'Hi')).toBe(links.viber);
    expect(withPrefilledText('telegram', links.telegram!, 'Hi')).toBe(links.telegram);
  });
});

describe('contacts.messengers setting', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  async function adminToken() {
    return (await createUser('super_admin')).token;
  }

  it('normalises on save and publishes verified deep links', async () => {
    const token = await adminToken();
    const save = await agent()
      .put('/settings/contacts.messengers')
      .set(auth(token))
      .send({ whatsapp: '093-88-28-18', viber: '+374 93 88 28 18', telegram: '@autoroom_am' });
    expect(save.status).toBe(200);

    const pub = await agent().get('/settings/public');
    expect(pub.body['contacts.messengers']).toMatchObject({
      whatsapp: '37493882818',
      telegram: 'autoroom_am',
      links: {
        whatsapp: 'https://wa.me/37493882818',
        viber: 'viber://chat?number=%2B37493882818',
        telegram: 'https://t.me/autoroom_am',
      },
    });
  });

  it('rejects a handle that cannot form a working link, and stores nothing', async () => {
    const token = await adminToken();
    const save = await agent()
      .put('/settings/contacts.messengers')
      .set(auth(token))
      .send({ whatsapp: 'call me maybe', viber: null, telegram: null });
    expect(save.status).toBe(400);
  });

  it('blank hides the link', async () => {
    const token = await adminToken();
    await agent()
      .put('/settings/contacts.messengers')
      .set(auth(token))
      .send({ whatsapp: '', viber: '', telegram: '' })
      .expect(200);
    const pub = await agent().get('/settings/public');
    expect(pub.body['contacts.messengers'].links).toEqual({
      whatsapp: null,
      viber: null,
      telegram: null,
    });
  });
});
