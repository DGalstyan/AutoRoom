import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Environment is parsed once, at startup, through zod. A missing or malformed
 * variable kills the process with a readable list rather than surfacing as an
 * `undefined` three layers deep at request time.
 *
 * Only variables the code actually reads today are declared here. Auth and
 * upload settings are documented in `.env.example` but stay out of the schema
 * until A1/Phase B read them — validating unused config just makes it harder to
 * boot the API.
 */

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
  CORS_ORIGINS: z
    .string()
    .min(1, 'CORS_ORIGINS must list the allowed web/admin origins')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  /**
   * Signs the short-lived access token. Refresh tokens need no secret: they are
   * opaque random bytes checked against a SHA-256 stored in the database, so
   * there is nothing to forge.
   */
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  /** `jsonwebtoken` duration string, e.g. `15m`. */
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /** Consecutive failures before an account is temporarily locked. */
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),

  /**
   * Where the reset link points — the admin SPA, not the API. The panel is
   * served under `/admin`, so the base includes that segment.
   */
  APP_URL: z.string().url('APP_URL must be the admin panel URL'),
  /**
   * This API's own public origin, used to build absolute URLs for uploaded
   * files (see routes/uploads.ts). Not derivable from the request: behind the
   * reverse proxy, the API is reached at `<domain>/api`, and the app has no
   * way to know that external prefix from `req` alone.
   */
  PUBLIC_API_URL: z.string().url('PUBLIC_API_URL must be the API public origin'),
  /** Leave unset for host-only cookies; set to share across subdomains. */
  COOKIE_DOMAIN: z.string().optional(),

  /**
   * SMS gateway. `console` (default) only logs the message and is refused in
   * production; `http` POSTs `{ to, text, sender }` as JSON to `SMS_HTTP_URL`
   * with `Authorization: Bearer SMS_HTTP_TOKEN` — the shape most Armenian and
   * international gateways accept through a thin webhook. Provider-specific
   * adapters slot into `lib/sms.ts` without touching callers.
   */
  SMS_PROVIDER: z.enum(['console', 'http']).default('console'),
  SMS_HTTP_URL: z.string().url().optional(),
  SMS_HTTP_TOKEN: z.string().optional(),
  SMS_SENDER: z.string().max(11).default('AutoRoom'),
  /**
   * `required` makes a "Become a dealer" meeting request carry a verified phone
   * (the SMS-code check). Off by default so the form keeps working until a
   * gateway is configured.
   */
  PHONE_VERIFICATION: z.enum(['off', 'required']).default('off'),
  PHONE_VERIFICATION_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  PHONE_VERIFICATION_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  /** Sends allowed to one phone per 15 minutes. */
  PHONE_VERIFICATION_MAX_SENDS: z.coerce.number().int().positive().default(3),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(`Invalid environment configuration:\n${issues}\n\nSee apps/api/.env.example.`);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
