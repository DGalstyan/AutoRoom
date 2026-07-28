/**
 * Package entry point. Server-side building blocks live here; consumers that
 * only need to *call* the API should import `@autoroom/api/client`, which has no
 * Express or Prisma dependency.
 */
export { createApp } from './app';
export { prisma } from './lib/prisma';
export { env } from './config/env';
export {
  AppError,
  ERROR_CODES,
  badRequest,
  conflict,
  forbidden,
  notFound,
  unauthorized,
} from './lib/errors';
export * from './rbac/permissions';
// Owns the shared wire types (ErrorCode, ApiErrorBody, …), so it is re-exported
// last and `./lib/errors` above deliberately exports only its own symbols.
export * from './client';
