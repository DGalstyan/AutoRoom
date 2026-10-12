import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  agent,
  auth,
  carBody,
  createCar,
  createOrder,
  createPartner,
  createUser,
  disconnect,
  resetData,
} from './helpers';

const PUBLISHED = new Date('2026-01-01T00:00:00.000Z');

describe('admin data rules', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  describe('car search', () => {
    it('matches every word, in any order, across make / model', async () => {
      const { token } = await createUser('super_admin');
      await createCar({ slug: 'mc', make: 'McLaren', model: '720S' });
      await createCar({ slug: 'seal', make: 'BYD', model: 'Seal' });
      await createCar({ slug: 'zeekr', make: 'Zeekr', model: '001' });

      const find = async (q: string) =>
        (await agent().get('/cars').query({ search: q }).set(auth(token))).body.items.map(
          (c: { slug: string }) => c.slug,
        );

      expect(await find('mclaren')).toEqual(['mc']);
      expect(await find('McLaren 720S')).toEqual(['mc']);
      expect(await find('720s mclaren')).toEqual(['mc']);
      expect(await find('BYD Seal')).toEqual(['seal']);
      expect(await find('BYD 720S')).toEqual([]);
    });

    it('treats % and _ as plain characters, not wildcards', async () => {
      const { token } = await createUser('super_admin');
      await createCar({ slug: 'a', make: 'McLaren', model: '720S' });
      await createCar({ slug: 'b', make: 'BYD', model: 'Seal' });
      for (const q of ['%', '_', '%%', 'mc%']) {
        const res = await agent().get('/cars').query({ search: q }).set(auth(token));
        expect(res.body.items, q).toHaveLength(0);
      }
    });

    it('the public search is wildcard-safe too', async () => {
      await createCar({ slug: 'a', make: 'McLaren', model: '720S', publishedAt: PUBLISHED });
      expect((await agent().get('/public/cars').query({ search: '%' })).body.items).toHaveLength(0);
      expect(
        (await agent().get('/public/cars').query({ search: 'mclaren 720s' })).body.items,
      ).toHaveLength(1);
    });
  });

  describe('order payments and stages', () => {
    it('refuses a payment above what is still due, and accepts the exact balance', async () => {
      const { token } = await createUser('super_admin');
      const car = await createCar({ price: 1000 });
      const order = await createOrder(car.id);
      const pay = (amount: number) =>
        agent()
          .post(`/orders/${order.id}/payments`)
          .set(auth(token))
          .send({ amount, paidAt: new Date().toISOString() });

      const over = await pay(1500);
      expect(over.status).toBe(400);
      expect(over.body.error.details.fields[0]).toMatchObject({ path: 'amount' });

      expect((await pay(400)).status).toBe(201);
      expect((await pay(700)).status).toBe(400); // only 600 left
      expect((await pay(600)).status).toBe(201);
      const after = await pay(1);
      expect(after.status).toBe(400);
      expect(after.body.error.details.fields[0].message).toMatch(/paid in full/i);
    });

    it('does not add a duplicate timeline entry for the stage the order is already at', async () => {
      const { token } = await createUser('super_admin');
      const car = await createCar();
      const order = await createOrder(car.id);
      const advance = (stage: string) =>
        agent()
          .post(`/orders/${order.id}/stages`)
          .set(auth(token))
          .send({ stage, occurredAt: new Date().toISOString() });

      const first = await advance('LOADING');
      expect(first.status).toBe(201);
      const again = await advance('LOADING');
      expect(again.status).toBe(400);
      expect(again.body.error.details.fields[0]).toMatchObject({ path: 'stage' });
      expect((await advance('IN_TRANSIT')).status).toBe(201);
    });
  });

  describe('partners and bookings', () => {
    it('rejects a junk partner phone and keeps real ones', async () => {
      const { token } = await createUser('super_admin');
      const body = (phone: string) => ({ name: 'P', phone, email: '', active: true });
      for (const bad of ['abc', 'xyz', '12', '++++++++']) {
        const res = await agent().post('/partners').set(auth(token)).send(body(bad));
        expect(res.status, bad).toBe(400);
        expect(res.body.error.details.fields[0]).toMatchObject({ path: 'phone' });
      }
      for (const good of ['+374 94 123456', '094123456', '(+374) 94-123-456', '']) {
        const res = await agent().post('/partners').set(auth(token)).send(body(good));
        expect(res.status, good).toBe(201);
      }
    });

    it('refuses a booking dated in the past or with a junk phone', async () => {
      const { token } = await createUser('super_admin');
      const partner = await createPartner();
      const book = (extra: Record<string, unknown>) =>
        agent()
          .post('/bookings')
          .set(auth(token))
          .send({
            partnerId: partner.id,
            scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
            ...extra,
          });

      const past = await book({ scheduledAt: '2026-01-01T10:00:00.000Z' });
      expect(past.status).toBe(400);
      expect(past.body.error.details.fields[0]).toMatchObject({ path: 'scheduledAt' });

      const junk = await book({ customerPhone: 'xyz' });
      expect(junk.status).toBe(400);
      expect(junk.body.error.details.fields[0]).toMatchObject({ path: 'customerPhone' });

      expect((await book({ customerPhone: '+374 94 123456' })).status).toBe(201);
    });
  });

  describe('readable validation messages', () => {
    it('says "required" and "at least N" instead of zod’s defaults', async () => {
      const { token } = await createUser('super_admin');
      const res = await agent()
        .post('/cars')
        .set(auth(token))
        .send(carBody({ make: '', year: 1900, model: undefined }));
      expect(res.status).toBe(400);
      const messages = res.body.error.details.fields
        .map((f: { message: string }) => f.message)
        .join(' | ');
      expect(messages).not.toMatch(/String must contain|Number must be greater/);
      expect(messages).toMatch(/required/i);
      expect(messages).toMatch(/at least 1950/);
    });
  });
});
