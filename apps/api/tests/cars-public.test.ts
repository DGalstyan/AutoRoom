import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { CarCondition, CarOrigin } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { agent, createCar, disconnect, resetData } from './helpers';

/**
 * `GET /public/cars` — unauthenticated, published-rows-only. The property
 * under test is that the China/USA listing filters (origin, condition, make,
 * model, price range) actually narrow the result set server-side, and that
 * an unpublished car never leaks through no matter what filter is applied.
 */
describe('public car listing', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  /** A small, deliberately mixed catalogue to filter against. */
  async function seedCatalogue() {
    const published = { publishedAt: new Date('2026-01-01T00:00:00.000Z') };
    const byd = await prisma.car.update({
      where: {
        id: (
          await createCar({
            origin: CarOrigin.CHINA,
            make: 'BYD',
            model: 'Seal',
            price: 32_900,
            condition: CarCondition.ON_ORDER,
          })
        ).id,
      },
      data: published,
    });
    const zeekr = await prisma.car.update({
      where: {
        id: (
          await createCar({
            origin: CarOrigin.CHINA,
            make: 'Zeekr',
            model: '001',
            price: 41_500,
            condition: CarCondition.ON_ORDER,
          })
        ).id,
      },
      data: published,
    });
    const tesla = await prisma.car.update({
      where: {
        id: (
          await createCar({
            origin: CarOrigin.USA,
            make: 'Tesla',
            model: 'Model 3',
            price: 27_500,
            condition: CarCondition.ON_ROAD,
          })
        ).id,
      },
      data: published,
    });
    // Never published — must never appear, whatever filter is applied.
    const draft = await createCar({
      origin: CarOrigin.CHINA,
      make: 'BYD',
      model: 'Han',
      price: 38_000,
      condition: CarCondition.ON_ORDER,
    });

    return { byd, zeekr, tesla, draft };
  }

  it('narrows to one origin', async () => {
    const { byd, zeekr } = await seedCatalogue();

    const response = await agent().get('/public/cars?origin=CHINA');

    expect(response.status).toBe(200);
    expect(response.body.items.map((c: { id: string }) => c.id).sort()).toEqual(
      [byd.id, zeekr.id].sort(),
    );
  });

  it('narrows to an exact make, case-insensitively', async () => {
    const { byd } = await seedCatalogue();

    const response = await agent().get('/public/cars?make=byd&origin=CHINA');

    expect(response.status).toBe(200);
    expect(response.body.items.map((c: { id: string }) => c.id)).toEqual([byd.id]);
  });

  it('narrows to an exact model', async () => {
    const { zeekr } = await seedCatalogue();

    const response = await agent().get('/public/cars?model=001');

    expect(response.status).toBe(200);
    expect(response.body.items.map((c: { id: string }) => c.id)).toEqual([zeekr.id]);
  });

  it('narrows to a price range', async () => {
    const { zeekr } = await seedCatalogue();

    const response = await agent().get('/public/cars?priceMin=40000&priceMax=45000');

    expect(response.status).toBe(200);
    expect(response.body.items.map((c: { id: string }) => c.id)).toEqual([zeekr.id]);
  });

  it('never returns an unpublished car, even when every filter matches it', async () => {
    const { draft } = await seedCatalogue();

    const response = await agent().get(
      `/public/cars?origin=CHINA&make=${draft.make}&model=${draft.model}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(0);
  });

  it('combines filters as AND, not OR', async () => {
    await seedCatalogue();

    // BYD exists, but not at Tesla's price point — combining them should
    // yield nothing rather than falling back to an OR match.
    const response = await agent().get('/public/cars?make=BYD&priceMin=27000&priceMax=28000');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(0);
  });
});
