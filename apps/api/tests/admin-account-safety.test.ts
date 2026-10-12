import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  agent,
  auth,
  createPartnerWithAccount,
  createUser,
  disconnect,
  resetData,
} from './helpers';

describe('admin account safety', () => {
  beforeEach(async () => {
    await resetData();
    await prisma.blogPost.deleteMany();
  });
  afterAll(disconnect);

  it('deleting a partner turns its portal login off (not just its open sessions)', async () => {
    const { token } = await createUser('super_admin');
    const { partner, user } = await createPartnerWithAccount();

    const res = await agent().delete(`/partners/${partner.id}`).set(auth(token));
    expect(res.status).toBe(204);

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.status).toBe('DISABLED');
  });

  it('only disables a partner-role login; an admin account linked to a partner is left alone', async () => {
    const { token } = await createUser('super_admin');
    const { user: admin } = await createUser('admin');
    const partner = await prisma.partner.create({
      data: { name: 'Linked', active: true, userId: admin.id },
    });

    await agent().delete(`/partners/${partner.id}`).set(auth(token));
    expect((await prisma.user.findUnique({ where: { id: admin.id } }))?.status).toBe('ACTIVE');
  });

  it('a super admin cannot change their own role', async () => {
    const { user, token } = await createUser('super_admin');
    const res = await agent()
      .patch(`/users/${user.id}/role`)
      .set(auth(token))
      .send({ roleKey: 'content_editor' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/own role/i);
    expect(
      (await prisma.user.findUnique({ where: { id: user.id }, include: { role: true } }))?.role
        ?.key,
    ).toBe('super_admin');
  });

  it('another super admin can still change a role (the system keeps a super admin)', async () => {
    const { token } = await createUser('super_admin');
    const { user: other } = await createUser('content_editor');
    const res = await agent()
      .patch(`/users/${other.id}/role`)
      .set(auth(token))
      .send({ roleKey: 'admin' });
    expect(res.status).toBe(200);
  });
});

describe('blog cover and story video validation', () => {
  beforeEach(async () => {
    await resetData();
    await prisma.blogPost.deleteMany();
  });

  const post = (overrides: Record<string, unknown> = {}) => ({
    slug: 'no-cover',
    title: { hy: 'Վերնագիր' },
    body: { hy: 'Տեքստ։' },
    published: false,
    ...overrides,
  });

  it('saves an article with no cover image whether the admin sends null, an empty string or nothing', async () => {
    const { token } = await createUser('super_admin');
    for (const [i, cover] of [
      [1, null],
      [2, ''],
      [3, undefined],
    ] as const) {
      const res = await agent()
        .post('/blog')
        .set(auth(token))
        .send(post({ slug: `no-cover-${i}`, coverUrl: cover }));
      expect(res.status).toBe(201);
      expect(res.body.coverUrl).toBeNull();
    }
  });

  it('names the cover field when the link is not a valid URL', async () => {
    const { token } = await createUser('super_admin');
    const res = await agent()
      .post('/blog')
      .set(auth(token))
      .send(post({ coverUrl: 'not a url' }));
    expect(res.status).toBe(400);
    expect(res.body.error.details.fields).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'coverUrl' })]),
    );
  });
});
