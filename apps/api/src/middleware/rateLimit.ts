import rateLimit from 'express-rate-limit';
import { isProduction } from '../config/env';
import type { ApiErrorBody } from '../lib/errors';

/**
 * Per-IP throttling on the unauthenticated endpoints. This is the blunt outer
 * layer; the per-account lockout in the login route is the sharper one, since
 * an attacker spreading attempts across IPs still trips it.
 *
 * Limits are relaxed outside production so a test run or a developer retrying a
 * form does not lock themselves out.
 */
function limiter(options: { windowMs: number; limit: number; message: string }) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: isProduction ? options.limit : options.limit * 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      const body: ApiErrorBody = {
        error: { code: 'RATE_LIMITED', message: options.message },
      };
      res.status(429).json(body);
    },
  });
}

export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many login attempts. Try again later.',
});

export const registerLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many registration attempts. Try again later.',
});

export const passwordResetLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many password reset requests. Try again later.',
});
