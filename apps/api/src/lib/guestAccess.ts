import crypto from 'node:crypto';
import { env } from '../config/env';

/**
 * Time-limited guest access to an auction listing's View-Only link.
 *
 * The staff-entered link (`Car.auctionViewUrl`) never leaves the server in the public car JSON;
 * a visitor gets a signed token that the API resolves to the link only while it is unexpired.
 * Stateless on purpose: the token carries `carId` and an expiry, signed with a key derived from
 * the access-token secret (so it cannot be forged or extended), and a random nonce makes each
 * issued token unique. There is nothing to clean up — an expired token simply stops verifying.
 */

const KEY = crypto
  .createHmac('sha256', env.JWT_ACCESS_SECRET)
  .update('auction-guest-access')
  .digest();

function sign(body: string): string {
  return crypto.createHmac('sha256', KEY).update(body).digest('base64url');
}

export function signGuestAccess(
  carId: string,
  ttlMinutes: number,
  now: number = Date.now(),
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(now + ttlMinutes * 60_000);
  const body = Buffer.from(
    JSON.stringify({ c: carId, e: expiresAt.getTime(), n: crypto.randomBytes(8).toString('hex') }),
  ).toString('base64url');
  return { token: `${body}.${sign(body)}`, expiresAt };
}

export type GuestAccessResult =
  { ok: true; carId: string; expiresAt: Date } | { ok: false; reason: 'invalid' | 'expired' };

export function verifyGuestAccess(token: string, now: number = Date.now()): GuestAccessResult {
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra !== undefined) return { ok: false, reason: 'invalid' };

  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'invalid' };
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      c?: unknown;
      e?: unknown;
    };
    if (typeof payload.c !== 'string' || typeof payload.e !== 'number') {
      return { ok: false, reason: 'invalid' };
    }
    if (payload.e <= now) return { ok: false, reason: 'expired' };
    return { ok: true, carId: payload.c, expiresAt: new Date(payload.e) };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/**
 * A guest link must be a link, not a shared login: no `user:password@` in the URL and no
 * credential-looking query parameters. (Anyone could read those from a browser's address bar.)
 */
export function isSafeGuestUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (url.username || url.password) return false;
  for (const key of url.searchParams.keys()) {
    if (/^(pass(word|wd)?|pwd|secret|login|user(name)?)$/i.test(key)) return false;
  }
  return true;
}
