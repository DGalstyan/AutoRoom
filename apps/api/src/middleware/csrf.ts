import type { RequestHandler } from 'express';
import { CSRF_COOKIE } from '../lib/cookies';
import { safeEqual } from '../lib/tokens';
import { forbidden } from '../lib/errors';

export const CSRF_HEADER = 'x-csrf-token';

/**
 * Double-submit CSRF check, for the endpoints that authenticate via the
 * `ar_refresh` cookie rather than a bearer token.
 *
 * The browser attaches cookies to cross-site requests on its own, so a cookie
 * alone proves nothing about intent. It will not, however, let another origin
 * *read* our cookies — so requiring the request to echo the `ar_csrf` cookie
 * value in a header proves the caller could read it, i.e. is same-origin.
 *
 * Bearer-token routes need none of this: an attacker's page cannot add an
 * Authorization header it does not know.
 */
export const requireCsrf: RequestHandler = (req, _res, next) => {
  const cookieToken = (req.cookies as Record<string, string | undefined> | undefined)?.[
    CSRF_COOKIE
  ];
  const headerValue = req.get(CSRF_HEADER);

  if (!cookieToken || !headerValue) {
    next(forbidden('Missing CSRF token'));
    return;
  }

  if (!safeEqual(cookieToken, headerValue)) {
    next(forbidden('Invalid CSRF token'));
    return;
  }

  next();
};
