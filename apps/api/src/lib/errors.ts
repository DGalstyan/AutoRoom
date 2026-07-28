/**
 * One error shape for the whole API, so the admin SPA and the public site can
 * handle failures without special-casing per endpoint:
 *
 *   { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": ... } }
 *
 * `code` is the stable, machine-readable part — clients branch on it. `message`
 * is for humans and may change.
 */

import type { ApiErrorBody, ErrorCode } from '../client/types';

export type { ApiErrorBody, ErrorCode };

/**
 * The HTTP status each code maps to. `ErrorCode` itself is declared in
 * `client/types.ts` — it is part of the wire contract consumers depend on, and
 * that module deliberately has no server-side imports.
 */
export const ERROR_CODES: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  SERVICE_UNAVAILABLE: 503,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = ERROR_CODES[code];
    this.details = details;
  }

  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError('VALIDATION_ERROR', message, details);
export const unauthorized = (message = 'Authentication required') =>
  new AppError('UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have permission to perform this action') =>
  new AppError('FORBIDDEN', message);
export const notFound = (message = 'Resource not found') => new AppError('NOT_FOUND', message);
export const conflict = (message: string, details?: unknown) =>
  new AppError('CONFLICT', message, details);
