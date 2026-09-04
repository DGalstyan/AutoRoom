import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';

/**
 * Team members — the "Մեր թիմը" grid on the About page: photo, name, title,
 * and an optional LinkedIn link (the Figma card only shows that icon for
 * people who have one). This route is what lets an admin add, reorder, or
 * remove a person without a deploy.
 */
export const teamRouter = Router();

const teamMemberBodySchema = z.object({
  name: z.string().trim().min(1, 'A name is required').max(80),
  title: z.string().trim().min(1, 'A title is required').max(80),
  photoUrl: z
    .union([z.string().url().max(2048), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullish(),
  linkedinUrl: z
    .union([z.string().url().max(2048), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullish(),
  /// Order of the cards in the team grid.
  position: z.number().int().min(0).max(999).default(0),
});

const ORDER = [
  { position: 'asc' },
  { name: 'asc' },
] satisfies Prisma.TeamMemberOrderByWithRelationInput[];

teamRouter.get('/team', requireAuth, requirePermission('team', 'READ'), async (_req, res) => {
  const items = await prisma.teamMember.findMany({ orderBy: ORDER });
  res.json({ items: items.map(serializeTeamMember), total: items.length });
});

teamRouter.post(
  '/team',
  requireAuth,
  requirePermission('team', 'CREATE'),
  validateBody(teamMemberBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof teamMemberBodySchema>;
    const member = await prisma.teamMember.create({ data: toWriteData(body) });

    await audit(req.auth?.userId, 'team.create', member.id, { name: member.name });
    res.status(201).json(serializeTeamMember(member));
  },
);

teamRouter.put(
  '/team/:id',
  requireAuth,
  requirePermission('team', 'UPDATE'),
  validateBody(teamMemberBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.teamMember.findUnique({ where: { id } })))
      throw notFound('Team member not found');

    const member = await prisma.teamMember.update({
      where: { id },
      data: toWriteData(req.body as z.infer<typeof teamMemberBodySchema>),
    });

    await audit(req.auth?.userId, 'team.update', id, { name: member.name });
    res.json(serializeTeamMember(member));
  },
);

teamRouter.delete(
  '/team/:id',
  requireAuth,
  requirePermission('team', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const member = await prisma.teamMember.findUnique({ where: { id } });
    if (!member) throw notFound('Team member not found');

    await prisma.teamMember.delete({ where: { id } });
    await audit(req.auth?.userId, 'team.delete', id, { name: member.name });
    res.status(204).end();
  },
);

/** Unauthenticated — the About page's team section reads this. */
teamRouter.get('/public/team', async (_req, res) => {
  const items = await prisma.teamMember.findMany({ orderBy: ORDER });
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ items: items.map(serializeTeamMember), total: items.length });
});

/* --------------------------------- helpers --------------------------------- */

function toWriteData(body: z.infer<typeof teamMemberBodySchema>) {
  return {
    name: body.name,
    title: body.title,
    photoUrl: body.photoUrl ?? null,
    linkedinUrl: body.linkedinUrl ?? null,
    position: body.position,
  };
}

function serializeTeamMember(member: Prisma.TeamMemberGetPayload<object>) {
  return {
    id: member.id,
    name: member.name,
    title: member.title,
    photoUrl: member.photoUrl,
    linkedinUrl: member.linkedinUrl,
    position: member.position,
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'team',
      resourceId,
      dataJson: data as never,
    },
  });
}
