import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { agent, auth, createCar, createUser, disconnect, resetData } from './helpers';

/**
 * Sample (demo) VIN/lot values stay in the admin's records but must never be
 * shown to website visitors; real identification numbers are untouched.
 */
describe('public cars hide demo VIN / lot', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  const published = { publishedAt: new Date('2026-01-01T00:00:00.000Z') };

  it('withholds a masked VIN and a sample lot from the public list and detail', async () => {
    const car = await createCar({
      slug: 'ford-f150',
      vin: '1FTFW1E5*NF000000',
      lotNumber: 'IAAI-48213077',
      ...published,
    });

    const list = await agent().get('/public/cars');
    const listed = list.body.items.find((c: { id: string }) => c.id === car.id);
    expect(listed.vin).toBeNull();
    expect(listed.lotNumber).toBeNull();

    const detail = await agent().get('/public/cars/ford-f150');
    expect(detail.body.vin).toBeNull();
    expect(detail.body.lotNumber).toBeNull();
  });

  it('hides each field independently — a real lot stays when only the VIN is a placeholder', async () => {
    await createCar({
      slug: 'honda-crv',
      vin: '5J6RW2H8*ME000000',
      lotNumber: '58392011',
      ...published,
    });
    const detail = await agent().get('/public/cars/honda-crv');
    expect(detail.body.vin).toBeNull();
    expect(detail.body.lotNumber).toBe('58392011');
  });

  it('shows real-looking identification numbers exactly as stored', async () => {
    await createCar({
      slug: 'li-auto-l9',
      vin: 'LW433B1K5N1000001',
      lotNumber: '58392011',
      ...published,
    });
    const detail = await agent().get('/public/cars/li-auto-l9');
    expect(detail.body.vin).toBe('LW433B1K5N1000001');
    expect(detail.body.lotNumber).toBe('58392011');
  });

  it('hides them on similar-car picks too', async () => {
    const a = await createCar({ slug: 'a-car', ...published });
    const b = await createCar({ slug: 'b-car', vin: '5YJ3E1EA*XF000000', ...published });
    await prisma.carSimilar.create({ data: { carId: a.id, similarCarId: b.id, position: 0 } });

    const detail = await agent().get('/public/cars/a-car');
    expect(detail.body.similarCars).toHaveLength(1);
    expect(detail.body.similarCars[0].vin).toBeNull();
  });

  it('leaves the stored value alone: the admin API still returns it', async () => {
    const car = await createCar({ slug: 'tesla-model-3', vin: '5YJ3E1EA*XF000000', ...published });
    const { token } = await createUser('admin');

    const adminView = await agent().get(`/cars/${car.id}`).set(auth(token));
    expect(adminView.status).toBe(200);
    expect(adminView.body.vin).toBe('5YJ3E1EA*XF000000');

    const row = await prisma.car.findUniqueOrThrow({ where: { id: car.id } });
    expect(row.vin).toBe('5YJ3E1EA*XF000000');
  });
});
