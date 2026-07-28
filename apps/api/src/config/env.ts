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
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
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
