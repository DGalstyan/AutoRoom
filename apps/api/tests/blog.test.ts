import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { agent, auth, createUser, disconnect, resetData } from './helpers';

describe('blog', () => {
  beforeEach(async () => {
    await resetData();
    await prisma.blogPost.deleteMany();
  });
  afterAll(disconnect);

  const post = (overrides: Record<string, unknown> = {}) => ({
    slug: 'how-to-import-a-car',
    title: { hy: 'Ինչպես ներմուծել մեքենա' },
    body: { hy: 'Առաջին պարբերություն։\n\nԵրկրորդ պարբերություն։' },
    published: false,
    ...overrides,
  });

  it('drafts stay off the public site; publishing puts them on it', async () => {
    const { token } = await createUser('super_admin');
    const created = await agent().post('/blog').set(auth(token)).send(post());
    expect(created.status).toBe(201);

    expect((await agent().get('/public/blog')).body.items).toHaveLength(0);
    expect((await agent().get('/public/blog/how-to-import-a-car')).status).toBe(404);

    const published = await agent()
      .post(`/blog/${created.body.id}/publish`)
      .set(auth(token))
      .send({ published: true });
    expect(published.status).toBe(200);
    expect((await agent().get('/public/blog')).body.items).toHaveLength(1);
    expect((await agent().get('/public/blog/how-to-import-a-car')).body.title.hy).toContain(
      'Ինչպես',
    );
  });

  it('cannot be published without Armenian text', async () => {
    const { token } = await createUser('super_admin');
    const noBody = await agent()
      .post('/blog')
      .set(auth(token))
      .send(post({ body: { en: 'English only' }, published: true }));
    expect(noBody.status).toBe(400);

    const draft = await agent()
      .post('/blog')
      .set(auth(token))
      .send(post({ body: { en: 'English only' } }));
    expect(draft.status).toBe(201);
    const publish = await agent()
      .post(`/blog/${draft.body.id}/publish`)
      .set(auth(token))
      .send({ published: true });
    expect(publish.status).toBe(400);
  });

  it('keeps URLs unique and well-formed', async () => {
    const { token } = await createUser('super_admin');
    await agent().post('/blog').set(auth(token)).send(post());
    expect((await agent().post('/blog').set(auth(token)).send(post())).status).toBe(409);
    expect(
      (
        await agent()
          .post('/blog')
          .set(auth(token))
          .send(post({ slug: 'Bad Slug!' }))
      ).status,
    ).toBe(400);
  });

  it('keeps the original publish moment across edits', async () => {
    const { token } = await createUser('super_admin');
    const created = await agent()
      .post('/blog')
      .set(auth(token))
      .send(post({ published: true }));
    const first = created.body.publishedAt;
    const edited = await agent()
      .put(`/blog/${created.body.id}`)
      .set(auth(token))
      .send(post({ published: true, title: { hy: 'Նոր վերնագիր' } }));
    expect(edited.body.publishedAt).toBe(first);
  });

  it('is staff-only to write', async () => {
    expect((await agent().post('/blog').send(post())).status).toBe(401);
    const { token } = await createUser('partner');
    expect((await agent().post('/blog').set(auth(token)).send(post())).status).toBe(403);
  });
});
