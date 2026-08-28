import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';

/**
 * Banks — the partner-bank grid behind the China (and USA) page's financing
 * section: logo, the bank's own auto-loan page (opens in a new tab), and one
 * row flagged `inHouse` for AutoRoom's own pre-arrival financing offer, which
 * has no `loanUrl` and opens the financing detail popup instead of a bank's
 * site. Seeded once (Ameriabank, Evoca, IDBank, AutoRoom) — this route is
 * what lets an admin attach a real logo or fix a link without a deploy.
 */
export const banksRouter = Router();

const bankBodySchema = z.object({
  name: z.string().trim().min(1, 'A name is required').max(80),
  logoUrl: z
    .union([z.string().url().max(2048), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullish(),
  loanUrl: z
    .union([z.string().url().max(2048), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullish(),
  inHouse: z.boolean().default(false),
  /// Order of the logos in the financing grid.
  position: z.number().int().min(0).max(999).default(0),
});

const ORDER = [
  { position: 'asc' },
  { name: 'asc' },
] satisfies Prisma.BankOrderByWithRelationInput[];

banksRouter.get('/banks', requireAuth, requirePermission('banks', 'READ'), async (_req, res) => {
  const items = await prisma.bank.findMany({ orderBy: ORDER });
  res.json({ items: items.map(serializeBank), total: items.length });
});

banksRouter.post(
  '/banks',
  requireAuth,
  requirePermission('banks', 'CREATE'),
  validateBody(bankBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof bankBodySchema>;
    const bank = await prisma.bank.create({ data: toWriteData(body) });

    await audit(req.auth?.userId, 'bank.create', bank.id, { name: bank.name });
    res.status(201).json(serializeBank(bank));
  },
);

banksRouter.put(
  '/banks/:id',
  requireAuth,
  requirePermission('banks', 'UPDATE'),
  validateBody(bankBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.bank.findUnique({ where: { id } }))) throw notFound('Bank not found');

    const bank = await prisma.bank.update({
      where: { id },
      data: toWriteData(req.body as z.infer<typeof bankBodySchema>),
    });

    await audit(req.auth?.userId, 'bank.update', id, { name: bank.name });
    res.json(serializeBank(bank));
  },
);

banksRouter.delete(
  '/banks/:id',
  requireAuth,
  requirePermission('banks', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const bank = await prisma.bank.findUnique({ where: { id } });
    if (!bank) throw notFound('Bank not found');

    await prisma.bank.delete({ where: { id } });
    await audit(req.auth?.userId, 'bank.delete', id, { name: bank.name });
    res.status(204).end();
  },
);

/** Unauthenticated — the China/USA financing sections read this. */
banksRouter.get('/public/banks', async (_req, res) => {
  const items = await prisma.bank.findMany({ orderBy: ORDER });
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ items: items.map(serializeBank), total: items.length });
});

/* --------------------------------- helpers --------------------------------- */

function toWriteData(body: z.infer<typeof bankBodySchema>) {
  return {
    name: body.name,
    logoUrl: body.logoUrl ?? null,
    loanUrl: body.loanUrl ?? null,
    inHouse: body.inHouse,
    position: body.position,
  };
}

function serializeBank(bank: Prisma.BankGetPayload<object>) {
  return {
    id: bank.id,
    name: bank.name,
    logoUrl: bank.logoUrl,
    loanUrl: bank.loanUrl,
    inHouse: bank.inHouse,
    position: bank.position,
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'banks',
      resourceId,
      dataJson: data as never,
    },
  });
}
