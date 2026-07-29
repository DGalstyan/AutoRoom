/**
 * The test database URL, resolved in one place.
 *
 * Both `vitest.config.ts` (which injects it into the workers) and
 * `globalSetup.ts` (which creates and migrates the database) need it, and they
 * run in different processes — `test.env` is applied to workers only, so the
 * setup process cannot read it back. Sharing this constant is what keeps the
 * two from drifting onto different databases.
 *
 * Overridable so CI can point at its own service container.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://autoroom:autoroom@localhost:55432/autoroom_test?schema=public';
