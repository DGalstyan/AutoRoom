import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError, badRequest } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { sendSms, SmsNotConfiguredError } from '../lib/sms';

/**
 * SMS-code check of a phone number — the "prove you hold this number" step in
 * front of the "Become a dealer" meeting request.
 *
 * Flow: `startPhoneVerification` stores a salted hash of a 6-digit code and
 * texts the code; `confirmPhoneVerification` checks it and, on success, hands
 * back a short-lived signed token naming the phone. The lead endpoint accepts
 * that token as proof, so it needs no lookup and the form can be submitted a
 * few minutes after the check without keeping a server session.
 *
 * Abuse limits live here, not only at the HTTP edge: per-phone send cap (a
 * stranger cannot be spammed with codes), a wrong-guess cap per code (a
 * 6-digit code cannot be brute-forced), expiry, and single use.
 */

const SEND_WINDOW_MS = 15 * 60 * 1000;
const TOKEN_TTL = '20m';
const TOKEN_PURPOSE = 'phone-verification';

/**
 * E.164 for the numbers the site actually sees: `094 077757`, `+374 94 077757`,
 * `37494077757` and `(94) 07-77-57` all become `+37494077757`. Anything that
 * does not look like a phone number throws a validation error.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  let candidate = digits;
  if (candidate.startsWith('00')) candidate = `+${candidate.slice(2)}`;
  else if (/^0\d{8}$/.test(candidate)) candidate = `+374${candidate.slice(1)}`;
  else if (/^\d{8}$/.test(candidate)) candidate = `+374${candidate}`;
  else if (/^374\d{8}$/.test(candidate)) candidate = `+${candidate}`;
  else if (!candidate.startsWith('+')) candidate = `+${candidate}`;
  if (!/^\+\d{8,15}$/.test(candidate)) throw badRequest('Enter a valid phone number');
  return candidate;
}

function hashCode(phone: string, code: string): string {
  return crypto
    .createHash('sha256')
    .update(`${phone}:${code}:${env.JWT_ACCESS_SECRET}`)
    .digest('hex');
}

function messageFor(locale: string, code: string): string {
  if (locale === 'en') return `AutoRoom: your verification code is ${code}`;
  if (locale === 'ru') return `AutoRoom: ваш код подтверждения ${code}`;
  return `AutoRoom: ձեր հաստատման կոդը՝ ${code}`;
}

export async function startPhoneVerification(rawPhone: string, locale = 'hy'): Promise<void> {
  const phone = normalizePhone(rawPhone);

  const recentSends = await prisma.phoneVerification.count({
    where: { phone, createdAt: { gt: new Date(Date.now() - SEND_WINDOW_MS) } },
  });
  if (recentSends >= env.PHONE_VERIFICATION_MAX_SENDS) {
    throw new AppError('RATE_LIMITED', 'Too many codes requested. Try again in a few minutes.');
  }

  // randomInt is uniform; padStart keeps leading zeros ("004217").
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const record = await prisma.phoneVerification.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(Date.now() + env.PHONE_VERIFICATION_TTL_MINUTES * 60 * 1000),
    },
  });

  try {
    await sendSms({ to: phone, text: messageFor(locale, code) });
  } catch (error) {
    // An unsent code is a dead record that would also eat the phone's send quota.
    await prisma.phoneVerification.delete({ where: { id: record.id } }).catch(() => undefined);
    if (error instanceof SmsNotConfiguredError) {
      throw new AppError('SERVICE_UNAVAILABLE', 'SMS verification is not available right now');
    }
    throw new AppError('SERVICE_UNAVAILABLE', 'Could not send the code. Try again shortly.');
  }
}

/** Returns the signed proof, or throws a validation error the form can show. */
export async function confirmPhoneVerification(rawPhone: string, code: string): Promise<string> {
  const phone = normalizePhone(rawPhone);

  const record = await prisma.phoneVerification.findFirst({
    where: { phone, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw badRequest('The code has expired. Request a new one.');
  if (record.attempts >= env.PHONE_VERIFICATION_MAX_ATTEMPTS) {
    throw badRequest('Too many wrong attempts. Request a new code.');
  }

  const expected = Buffer.from(record.codeHash, 'hex');
  const actual = Buffer.from(hashCode(phone, code.trim()), 'hex');
  const ok = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!ok) {
    await prisma.phoneVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw badRequest('That code is not right.');
  }

  await prisma.phoneVerification.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() },
  });

  return jwt.sign({ purpose: TOKEN_PURPOSE, phone }, env.JWT_ACCESS_SECRET, {
    expiresIn: TOKEN_TTL,
    issuer: 'autoroom-api',
  });
}

/** True only for a valid, unexpired proof issued for exactly this phone number. */
export function isPhoneProofValid(token: string | undefined, rawPhone: string): boolean {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'autoroom-api' });
    if (typeof decoded === 'string') return false;
    return decoded.purpose === TOKEN_PURPOSE && decoded.phone === normalizePhone(rawPhone);
  } catch {
    return false;
  }
}

export function phoneVerificationRequired(): boolean {
  return env.PHONE_VERIFICATION === 'required';
}
