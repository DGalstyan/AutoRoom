import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

/**
 * Branches, read-only.
 *
 * Deliberately just the list: the availability editor needs somewhere to say
 * *where* a slot is, and inventing a branch picker that posts to nothing would
 * be worse than one that reads the seeded rows. Full branch CRUD belongs with
 * the Settings module (`references/admin.md` A4) and is not written yet.
 */
export const branchesRouter = Router();

branchesRouter.get(
  '/branches',
  requireAuth,
  requirePermission('branches', 'READ'),
  async (_req, res) => {
    const branches = await prisma.branch.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, city: true, address: true, phone: true, hours: true },
    });

    res.json({ items: branches, total: branches.length });
  },
);
