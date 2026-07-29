import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './tests/config';

/**
 * These are integration tests, not unit tests, and deliberately so.
 *
 * The permission matrix lives in database rows — `requirePermission` reads what
 * `loadAuthContext` fetched on that request, which is the whole point of making
 * roles editable at runtime. A test with a mocked Prisma would be asserting
 * that the mock returns what the test put in it, and would keep passing after a
 * seed change that silently widened a role. So these run against real Postgres
 * with the real migrations and the real seed.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    // One worker: every test shares one database and truncates between cases,
    // so parallel files would tear each other's rows out mid-assertion.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,

    /**
     * Set before any module loads, which matters more than it looks:
     * `config/env.ts` calls `dotenv.config()` on `apps/api/.env`, and dotenv
     * does not override variables that already exist. Without this the suite
     * would connect to the developer's own database and truncate it.
     */
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: 'test-only-secret-not-used-outside-the-suite-0123456789',
      ACCESS_TOKEN_TTL: '15m',
      CORS_ORIGINS: 'http://localhost:3000',
      APP_URL: 'http://localhost:3000/admin',
    },
  },
});
