import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { TEST_DATABASE_URL } from './config';

/**
 * Brings up a real test database once per run: create it if missing, apply the
 * committed migrations, seed the roles and permissions the RBAC tests assert
 * against.
 *
 * `migrate deploy` rather than `migrate dev` — the same command CI and
 * production use. A migration that only applies to an already-migrated
 * database should fail here too, not just in CI.
 */
export default async function setup() {
  // Not `process.env.DATABASE_URL`: `test.env` reaches the workers, not this
  // process, so the shared constant is the only thing both sides agree on.
  const url = TEST_DATABASE_URL;

  await ensureDatabaseExists(url);

  const apiRoot = path.resolve(__dirname, '..');
  const env = { ...process.env, DATABASE_URL: url };

  // Inherit stdio so a migration failure is readable rather than a swallowed
  // exit code.
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: apiRoot, env, stdio: 'inherit' });
  execFileSync('npx', ['tsx', 'prisma/seed.ts'], {
    cwd: apiRoot,
    env: {
      ...env,
      // A fixed password so nothing prints a generated one into the test log.
      SEED_SUPER_ADMIN_PASSWORD: 'test-seed-password',
    },
    stdio: 'inherit',
  });
}

/**
 * `migrate deploy` fails outright on a database that does not exist, so connect
 * to the server's default `postgres` database and create it first.
 */
async function ensureDatabaseExists(url: string) {
  const parsed = new URL(url);
  const name = parsed.pathname.replace(/^\//, '');
  if (!name) throw new Error(`Could not read a database name from DATABASE_URL`);

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });
  try {
    const existing = await admin.$queryRawUnsafe<{ datname: string }[]>(
      'SELECT datname FROM pg_database WHERE datname = $1',
      name,
    );
    if (existing.length === 0) {
      // Identifier, so it cannot be parameterised. It comes from our own config
      // rather than a request, and the quoting keeps a surprising name safe.
      await admin.$executeRawUnsafe(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
      console.log(`[tests] created database ${name}`);
    }
  } finally {
    await admin.$disconnect();
  }
}
