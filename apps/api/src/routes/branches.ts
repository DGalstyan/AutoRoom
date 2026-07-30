import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';

/**
 * Branches — the pins behind Homepage S8 `Մեր մասնաճյուղերը` and the Contact
 * page, and the source the availability editor names a slot's location from.
 *
 * Everything the branch popup shows is a column here: photo, address, phone and
 * opening hours. `lat`/`lng` place the pin on the Armenia map and `mapUrl`
 * backs the `Ուղղություն` link, so a branch can be added without a deploy —
 * which is the point. `references/branches.md` records a fourth pin (a second
 * Armavir point) whose address is still unconfirmed; with this, whoever
 * confirms it can enter it themselves instead of filing a code change.
 */
export const branchesRouter = Router();

const branchBodySchema = z.object({
  name: z.string().trim().min(1, 'A name is required').max(120),
  city: z.string().trim().min(1, 'A city is required').max(80),
  address: z.string().trim().min(1, 'An address is required').max(200),
  phone: z.string().trim().min(1, 'A phone number is required').max(40),
  hours: z.string().trim().min(1, 'Opening hours are required').max(80),

  // Armenia sits well inside these, but the check is the generic one: a
  // transposed pair should fail here rather than drop a pin in the ocean.
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  mapUrl: z
    .union([z.string().url().max(2048), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullish(),
  photoUrl: z
    .union([z.string().url().max(2048), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullish(),

  /// Order of the pins and of the cards beneath the map.
  position: z.number().int().min(0).max(999).default(0),
});

const ORDER = [
  { position: 'asc' },
  { name: 'asc' },
] satisfies Prisma.BranchOrderByWithRelationInput[];

branchesRouter.get(
  '/branches',
  requireAuth,
  requirePermission('branches', 'READ'),
  async (_req, res) => {
    const items = await prisma.branch.findMany({ orderBy: ORDER });
    res.json({ items: items.map(serializeBranch), total: items.length });
  },
);

branchesRouter.post(
  '/branches',
  requireAuth,
  requirePermission('branches', 'CREATE'),
  validateBody(branchBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof branchBodySchema>;
    const branch = await prisma.branch.create({ data: toWriteData(body) });

    await audit(req.auth?.userId, 'branch.create', branch.id, { name: branch.name });
    res.status(201).json(serializeBranch(branch));
  },
);

branchesRouter.put(
  '/branches/:id',
  requireAuth,
  requirePermission('branches', 'UPDATE'),
  validateBody(branchBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.branch.findUnique({ where: { id } }))) throw notFound('Branch not found');

    const branch = await prisma.branch.update({
      where: { id },
      data: toWriteData(req.body as z.infer<typeof branchBodySchema>),
    });

    await audit(req.auth?.userId, 'branch.update', id, { name: branch.name });
    res.json(serializeBranch(branch));
  },
);

/**
 * Removes a branch. Availability slots held there survive with `branchId`
 * nulled (`SetNull` on the relation) rather than vanishing — closing an office
 * should not silently cancel the appointments booked into it.
 */
branchesRouter.delete(
  '/branches/:id',
  requireAuth,
  requirePermission('branches', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw notFound('Branch not found');

    await prisma.branch.delete({ where: { id } });
    await audit(req.auth?.userId, 'branch.delete', id, { name: branch.name });
    res.status(204).end();
  },
);

/** Unauthenticated — the map, the footer and the Contact page all read this. */
branchesRouter.get('/public/branches', async (_req, res) => {
  const items = await prisma.branch.findMany({ orderBy: ORDER });
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ items: items.map(serializeBranch), total: items.length });
});

/* --------------------------------- helpers --------------------------------- */

function toWriteData(body: z.infer<typeof branchBodySchema>) {
  return {
    name: body.name,
    city: body.city,
    address: body.address,
    phone: body.phone,
    hours: body.hours,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    mapUrl: body.mapUrl ?? null,
    photoUrl: body.photoUrl ?? null,
    position: body.position,
  };
}

function serializeBranch(branch: Prisma.BranchGetPayload<object>) {
  return {
    id: branch.id,
    name: branch.name,
    city: branch.city,
    address: branch.address,
    phone: branch.phone,
    hours: branch.hours,
    lat: branch.lat,
    lng: branch.lng,
    mapUrl: branch.mapUrl,
    photoUrl: branch.photoUrl,
    position: branch.position,
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'branches',
      resourceId,
      dataJson: data as never,
    },
  });
}
