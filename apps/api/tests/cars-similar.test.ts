import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { CarCondition, CarOrigin } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { agent, auth, createCar, createUser, disconnect, resetData } from './helpers';

/**
 * Admin-curated "Նմանատիպ առաջարկներ" (`CarSimilar`) — an ordered,
 * hand-picked list per car, distinct from `lib/cars.ts`'s automatic
 * same-origin/powertrain/price-distance fallback the public site uses when
 * a car has no curated picks at all.
 */
describe('car similar-offers curation', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  async function publish(carId: string) {
    return prisma.car.update({
      where: { id: carId },
      data: { publishedAt: new Date('2026-01-01T00:00:00.000Z') },
    });
  }

  async function baseCarBody(overrides: Record<string, unknown> = {}) {
    return {
      slug: `car-${Math.random().toString(36).slice(2, 10)}`,
      origin: CarOrigin.CHINA,
      make: 'Zeekr',
      model: '001',
      year: 2024,
      powertrain: 'EV',
      price: 42_000,
      condition: CarCondition.ON_ORDER,
      financingAvailable: true,
      featured: false,
      colors: [],
      priceJourney: [],
      similarCarIds: [],
      ...overrides,
    };
  }

  it('persists an ordered similar-cars pick list and returns it on the car', async () => {
    const { token } = await createUser('admin');
    const a = await createCar({ make: 'BYD', model: 'Seal' });
    const b = await createCar({ make: 'Zeekr', model: '001' });
    const c = await createCar({ make: 'Li Auto', model: 'L9' });

    const response = await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(await baseCarBody({ slug: a.slug, make: a.make, similarCarIds: [c.id, b.id] }));

    expect(response.status).toBe(200);
    expect(response.body.similarCars.map((car: { id: string }) => car.id)).toEqual([c.id, b.id]);
  });

  it('rejects a car listing itself as similar', async () => {
    const { token } = await createUser('admin');
    const a = await createCar();

    const response = await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(await baseCarBody({ slug: a.slug, make: a.make, similarCarIds: [a.id] }));

    expect(response.status).toBe(400);
  });

  it('rejects a duplicate id in the pick list', async () => {
    const { token } = await createUser('admin');
    const a = await createCar();
    const b = await createCar();

    const response = await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(await baseCarBody({ slug: a.slug, make: a.make, similarCarIds: [b.id, b.id] }));

    expect(response.status).toBe(400);
  });

  it('rejects an id that is not a real car', async () => {
    const { token } = await createUser('admin');
    const a = await createCar();

    const response = await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(await baseCarBody({ slug: a.slug, make: a.make, similarCarIds: ['not-a-real-id'] }));

    expect(response.status).toBe(400);
  });

  it('replaces the whole list on a second update rather than appending', async () => {
    const { token } = await createUser('admin');
    const a = await createCar();
    const b = await createCar();
    const c = await createCar();

    await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(await baseCarBody({ slug: a.slug, make: a.make, similarCarIds: [b.id] }));

    const response = await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(await baseCarBody({ slug: a.slug, make: a.make, similarCarIds: [c.id] }));

    expect(response.status).toBe(200);
    expect(response.body.similarCars.map((car: { id: string }) => car.id)).toEqual([c.id]);
  });

  it('the public detail route drops a curated pick that has since been unpublished', async () => {
    const { token } = await createUser('admin');
    const a = await createCar();
    const published = await createCar();
    const unpublished = await createCar();
    await publish(a.id);
    await publish(published.id);
    // `unpublished` deliberately left as a draft.

    await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(
        await baseCarBody({
          slug: a.slug,
          make: a.make,
          similarCarIds: [published.id, unpublished.id],
        }),
      );

    const response = await agent().get(`/public/cars/${a.slug}`);

    expect(response.status).toBe(200);
    expect(response.body.similarCars.map((car: { id: string }) => car.id)).toEqual([published.id]);
  });

  it('the public listing route leaves similarCars empty on every row — curation is a per-car detail concern, not fetched for a grid of up to 100', async () => {
    const { token } = await createUser('admin');
    const a = await createCar();
    const b = await createCar();
    await publish(a.id);
    await publish(b.id);

    await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(await baseCarBody({ slug: a.slug, make: a.make, similarCarIds: [b.id] }));

    const response = await agent().get('/public/cars');

    expect(response.status).toBe(200);
    // `serializeCar` always adds the key (so every Car response has the same
    // shape); the list route just never fetches `similarAsSource`, so it's
    // always `[]` here — even for `a`, which really does have one curated
    // pick, confirming this isn't accidentally leaking through a shared cache.
    for (const car of response.body.items) {
      expect(car.similarCars).toEqual([]);
    }
  });

  it('the admin list route does include similarCars, unlike the public one — the admin UI round-trips a list row straight back through PUT as an update body, and a leaner list include would silently blank out real curated picks on every unrelated quick-toggle', async () => {
    const { token } = await createUser('admin');
    const a = await createCar();
    const b = await createCar();

    await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send(await baseCarBody({ slug: a.slug, make: a.make, similarCarIds: [b.id] }));

    const listResponse = await agent().get('/cars').set(auth(token));
    expect(listResponse.status).toBe(200);
    const rowFromList = listResponse.body.items.find((car: { id: string }) => car.id === a.id);
    expect(rowFromList.similarCars.map((car: { id: string }) => car.id)).toEqual([b.id]);

    // The actual regression this guards: toggling an unrelated field (as
    // `CarsPage.tsx`'s "feature" quick-action does) from data the list route
    // returned must not wipe the curated list.
    const toggleResponse = await agent()
      .put(`/cars/${a.id}`)
      .set(auth(token))
      .send({
        ...rowFromList,
        similarCarIds: rowFromList.similarCars.map((c: { id: string }) => c.id),
        featured: true,
      });
    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.similarCars.map((car: { id: string }) => car.id)).toEqual([b.id]);
  });
});
