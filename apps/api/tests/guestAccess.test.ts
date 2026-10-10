import { describe, expect, it } from 'vitest';
import { isSafeGuestUrl, signGuestAccess, verifyGuestAccess } from '../src/lib/guestAccess';

const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);

describe('guest access tokens', () => {
  it('verify until the expiry, then report expired', () => {
    const { token } = signGuestAccess('car_1', 60, NOW);
    expect(verifyGuestAccess(token, NOW + 59 * 60_000)).toMatchObject({ ok: true, carId: 'car_1' });
    expect(verifyGuestAccess(token, NOW + 60 * 60_000)).toEqual({ ok: false, reason: 'expired' });
  });
  it('expire after exactly the configured minutes', () => {
    const { expiresAt } = signGuestAccess('car_1', 15, NOW);
    expect(expiresAt.getTime() - NOW).toBe(15 * 60_000);
  });
  it('cannot be forged, extended or pointed at another car', () => {
    const { token } = signGuestAccess('car_1', 5, NOW);
    const [body, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ c: 'car_2', e: NOW + 9e9, n: 'x' })).toString(
      'base64url',
    );
    expect(verifyGuestAccess(`${forged}.${sig}`, NOW)).toEqual({ ok: false, reason: 'invalid' });
    expect(verifyGuestAccess(`${body}.AAAA`, NOW)).toEqual({ ok: false, reason: 'invalid' });
    expect(verifyGuestAccess('garbage', NOW)).toEqual({ ok: false, reason: 'invalid' });
    expect(verifyGuestAccess(`${token}.extra`, NOW)).toEqual({ ok: false, reason: 'invalid' });
  });
  it('issues a different token every time', () => {
    expect(signGuestAccess('car_1', 5, NOW).token).not.toBe(signGuestAccess('car_1', 5, NOW).token);
  });
});

describe('isSafeGuestUrl', () => {
  it('accepts plain http(s) links', () => {
    expect(isSafeGuestUrl('https://www.copart.com/lot/12345678')).toBe(true);
  });
  it('rejects a shared login in the URL', () => {
    expect(isSafeGuestUrl('https://guest:secret@www.copart.com/lot/1')).toBe(false);
    expect(isSafeGuestUrl('https://www.copart.com/login?username=a&password=b')).toBe(false);
    expect(isSafeGuestUrl('https://x.com/?pwd=1')).toBe(false);
  });
  it('rejects non-http schemes and junk', () => {
    expect(isSafeGuestUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeGuestUrl('not a url')).toBe(false);
  });
});
