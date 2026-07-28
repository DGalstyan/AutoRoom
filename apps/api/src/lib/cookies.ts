import crypto from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import { env, isProduction } from '../config/env';

/**
 * Cookie contract for the auth flow.
 *
 * `ar_refresh` is httpOnly so script running on the page — including anything
 * injected by an XSS — cannot read it. That protection is exactly why it needs
 * a CSRF partner: a cookie the browser attaches automatically can be driven by
 * a cross-site request. `ar_csrf` is therefore deliberately *readable* by the
 * SPA, which echoes it back in a header (see middleware/csrf.ts).
 */

export const REFRESH_COOKIE = 'ar_refresh';
export const CSRF_COOKIE = 'ar_csrf';

function baseOptions(): CookieOptions {
  return {
    // `lax` rather than `strict`: the admin SPA is served from a different port
    // in development, and `strict` drops the cookie on top-level navigations
    // back into the app. Combined with the CSRF header check this is safe.
    sameSite: 'lax',
    secure: isProduction,
    domain: env.COOKIE_DOMAIN,
    path: '/',
  };
}

export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions(),
    httpOnly: true,
    expires: expiresAt,
  });
}

export function setCsrfCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(CSRF_COOKIE, token, {
    ...baseOptions(),
    // Readable on purpose — the client copies it into the x-csrf-token header.
    httpOnly: false,
    expires: expiresAt,
  });
}

export function clearAuthCookies(res: Response) {
  const options = baseOptions();
  res.clearCookie(REFRESH_COOKIE, { ...options, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false });
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}
