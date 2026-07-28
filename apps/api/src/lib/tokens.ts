import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from './errors';

/**
 * Two very different tokens, deliberately:
 *
 * - **Access token** — a short-lived JWT the client sends as
 *   `Authorization: Bearer`. Stateless, so `/auth/me` and every guarded route
 *   verify it without a database round-trip for the signature itself.
 * - **Refresh token** — opaque random bytes, stored hashed and looked up on
 *   every use. Statefulness is the point: it can be revoked, rotated, and
 *   replay of a leaked one can be detected. It never appears in a JWT payload
 *   and never leaves the httpOnly cookie.
 */

export interface AccessTokenPayload {
  /** User id. */
  sub: string;
  /** Role key, for cheap checks; authoritative permissions are loaded per request. */
  role: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    issuer: 'autoroom-api',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'autoroom-api' });
    if (typeof decoded === 'string' || !decoded.sub) throw new Error('malformed payload');
    return { sub: String(decoded.sub), role: String((decoded as jwt.JwtPayload).role ?? '') };
  } catch (error) {
    // Expiry is the common case and the client reacts by refreshing, so it gets
    // its own code rather than a generic 401.
    if (error instanceof jwt.TokenExpiredError) throw unauthorized('Access token expired');
    throw unauthorized('Invalid access token');
  }
}

/** 256 bits of entropy — brute-forcing the stored hash is not a concern. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * SHA-256, not bcrypt. These tokens are long random strings rather than
 * user-chosen secrets, so there is no dictionary to slow down, and refresh
 * happens often enough that a deliberately slow hash would be a latency tax.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function passwordResetExpiry(): Date {
  return new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
}

/** Length-safe constant-time comparison for CSRF tokens and similar. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
