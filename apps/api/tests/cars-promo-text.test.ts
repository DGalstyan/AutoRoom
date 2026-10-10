import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { agent, auth, carBody, createCar, createUser, disconnect, resetData } from './helpers';

/** A promotion's terms and eligibility: per-language text, Armenian required, shown on the public car. */
describe('promotion terms and eligibility', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  const base = (overrides: Record<string, unknown> = {}) =>
    carBody({
      oldPrice: 50_000,
      price: 45_000,
      promoDeadline: '2030-01-01T00:00:00.000Z',
      ...overrides,
    });

  it('saves the wording per language and serves it on the public car', async () => {
    const { token } = await createUser('admin');
    const car = await createCar({
      slug: 'promo-car',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const res = await agent()
      .put(`/cars/${car.id}`)
      .set(auth(token))
      .send(
        base({
          slug: 'promo-car',
          promoTerms: { hy: 'ա\nբ', en: 'a\nb' },
          promoEligibility: { hy: 'Բոլորը' },
        }),
      );
    expect(res.status).toBe(200);

    const pub = await agent().get('/public/cars/promo-car');
    expect(pub.body.promoTerms).toEqual({ hy: 'ա\nբ', en: 'a\nb' });
    expect(pub.body.promoEligibility).toEqual({ hy: 'Բոլորը' });
  });

  it('collapses empty text to null (the site then shows its default wording)', async () => {
    const { token } = await createUser('admin');
    const car = await createCar({
      slug: 'plain-promo',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const res = await agent()
      .put(`/cars/${car.id}`)
      .set(auth(token))
      .send(
        base({ slug: 'plain-promo', promoTerms: { hy: '   ', en: '' }, promoEligibility: null }),
      );
    expect(res.status).toBe(200);
    const pub = await agent().get('/public/cars/plain-promo');
    expect(pub.body.promoTerms).toBeNull();
    expect(pub.body.promoEligibility).toBeNull();
  });

  it('requires the Armenian text once any other language is written', async () => {
    const { token } = await createUser('admin');
    const car = await createCar({ slug: 'no-hy' });
    const res = await agent()
      .put(`/cars/${car.id}`)
      .set(auth(token))
      .send(base({ slug: 'no-hy', promoTerms: { en: 'only english' } }));
    expect(res.status).toBe(400);
  });
});
