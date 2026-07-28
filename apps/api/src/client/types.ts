/**
 * Wire types shared between the API and its consumers (the Next.js site and the
 * admin SPA).
 *
 * These are hand-written rather than generated from Prisma on purpose: the
 * database row and the JSON response are allowed to diverge — `passwordHash`
 * must never appear here, and A3's public settings endpoint exposes a deliberate
 * subset. Endpoints added in A1+ append their request/response pairs here, and
 * the client below stays the only place that knows the URLs.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'SERVICE_UNAVAILABLE';

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  /** ISO 8601. */
  timestamp: string;
  database: { status: 'up'; latencyMs: number } | { status: 'down' };
}
