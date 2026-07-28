import { PrismaClient } from '@prisma/client';
import { isDevelopment } from '../config/env';

/**
 * One PrismaClient for the process. `tsx watch` re-evaluates modules on every
 * save, so in development the instance is parked on `globalThis` — otherwise a
 * few minutes of editing exhausts the database's connection limit.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (isDevelopment) globalForPrisma.prisma = prisma;
