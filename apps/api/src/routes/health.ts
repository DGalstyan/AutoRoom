import { Router } from 'express';
import { prisma } from '../lib/prisma';
import type { HealthResponse } from '../client/types';

/**
 * `GET /health` — liveness plus a real database round-trip.
 *
 * The DB check is what makes this useful to a load balancer: a process that is
 * up but cannot reach Postgres should not receive traffic, so a failed query
 * returns 503 rather than a cheerful 200.
 */
export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const startedAt = process.hrtime.bigint();
  let database: HealthResponse['database'];

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = {
      status: 'up',
      latencyMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
    };
  } catch {
    database = { status: 'down' };
  }

  const body: HealthResponse = {
    status: database.status === 'up' ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database,
  };

  res.status(database.status === 'up' ? 200 : 503).json(body);
});
