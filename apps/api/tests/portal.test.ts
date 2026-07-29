import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  agent,
  auth,
  createBooking,
  createCar,
  createPartner,
  createPartnerWithAccount,
  createUser,
  disconnect,
  resetData,
} from './helpers';

/**
 * Portal scoping.
 *
 * The property under test is that a partner can see their own rows and cannot
 * see or reach anyone else's — including by asking nicely. Every case sets up
 * *two* partners with data, because a suite with one partner would pass just as
 * happily against a route that forgot to filter at all.
 */
describe('partner portal scoping', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  /** Two partners, each with a car and a booking. Returns the first one's session. */
  async function twoPartners() {
    const mine = await createPartnerWithAccount({ name: 'Mine' });
    const theirs = await createPartnerWithAccount({ name: 'Theirs' });

    const myCar = await createCar({ partnerId: mine.partner.id, make: 'Zeekr', model: '001' });
    const theirCar = await createCar({ partnerId: theirs.partner.id, make: 'BYD', model: 'Han' });

    const myBooking = await createBooking(mine.partner.id, { customerName: 'Aram' });
    const theirBooking = await createBooking(theirs.partner.id, { customerName: 'Nare' });

    return { mine, theirs, myCar, theirCar, myBooking, theirBooking };
  }

  describe('reads are limited to the signed-in partner', () => {
    it('returns only their own cars', async () => {
      const { mine, myCar } = await twoPartners();

      const response = await agent().get('/portal/cars').set(auth(mine.token));

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.items.map((car: { id: string }) => car.id)).toEqual([myCar.id]);
    });

    it('returns only their own bookings', async () => {
      const { mine, myBooking } = await twoPartners();

      const response = await agent().get('/portal/bookings').set(auth(mine.token));

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.items.map((b: { id: string }) => b.id)).toEqual([myBooking.id]);
    });

    it('counts only their own rows on the dashboard', async () => {
      const { mine } = await twoPartners();

      const response = await agent().get('/portal/me').set(auth(mine.token));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(mine.partner.id);
      expect(response.body.counts.cars).toBe(1);
      expect(response.body.counts.bookings).toBe(1);
    });

    it('ignores a partnerId supplied by the caller', async () => {
      const { mine, theirs, myCar } = await twoPartners();

      // The routes take no partner id at all, so this should change nothing.
      // If someone later adds one as a convenience, this fails.
      const cars = await agent()
        .get(`/portal/cars?partnerId=${theirs.partner.id}`)
        .set(auth(mine.token));
      expect(cars.body.total).toBe(1);
      expect(cars.body.items[0].id).toBe(myCar.id);

      const bookings = await agent()
        .get(`/portal/bookings?partnerId=${theirs.partner.id}`)
        .set(auth(mine.token));
      expect(bookings.body.total).toBe(1);
      expect(bookings.body.items[0].partnerId).toBe(mine.partner.id);
    });

    it('shows nothing when nothing is assigned', async () => {
      const mine = await createPartnerWithAccount();
      await createCar(); // unassigned, and belongs to nobody

      const response = await agent().get('/portal/cars').set(auth(mine.token));
      expect(response.body.total).toBe(0);
    });
  });

  describe('the portal response is narrower than the admin one', () => {
    it('omits internal fields rather than relying on the UI to hide them', async () => {
      const mine = await createPartnerWithAccount();
      await createCar({
        partnerId: mine.partner.id,
        damageHistory: 'Front-end collision, repaired',
        oldPrice: 50_000,
      });

      const response = await agent().get('/portal/cars').set(auth(mine.token));
      const car = response.body.items[0];

      expect(car).toHaveProperty('make');
      expect(car).not.toHaveProperty('damageHistory');
      expect(car).not.toHaveProperty('oldPrice');
      expect(car).not.toHaveProperty('financingAvailable');
    });
  });

  describe('who may reach the portal at all', () => {
    it('refuses anonymous callers', async () => {
      for (const path of ['/portal/me', '/portal/cars', '/portal/bookings']) {
        expect((await agent().get(path)).status, path).toBe(401);
      }
    });

    it('refuses a partner-role account with no partner record attached', async () => {
      const { token } = await createUser('partner');

      for (const path of ['/portal/me', '/portal/cars', '/portal/bookings']) {
        expect((await agent().get(path).set(auth(token))).status, path).toBe(403);
      }
    });

    it('refuses staff, including super_admin', async () => {
      for (const role of ['super_admin', 'admin', 'manager', 'content_editor']) {
        const { token } = await createUser(role);
        const response = await agent().get('/portal/me').set(auth(token));
        expect(response.status, role).toBe(403);
      }
    });

    it('refuses a deactivated partner immediately, without waiting for the token to expire', async () => {
      const mine = await createPartnerWithAccount();
      expect((await agent().get('/portal/me').set(auth(mine.token))).status).toBe(200);

      await prisma.partner.update({ where: { id: mine.partner.id }, data: { active: false } });

      expect((await agent().get('/portal/me').set(auth(mine.token))).status).toBe(403);

      await prisma.partner.update({ where: { id: mine.partner.id }, data: { active: true } });
      expect((await agent().get('/portal/me').set(auth(mine.token))).status).toBe(200);
    });
  });

  describe('a partner cannot step sideways into the admin surface', () => {
    it('refuses every staff route', async () => {
      const mine = await createPartnerWithAccount();

      const reads = ['/cars', '/users', '/roles', '/settings', '/partners', '/bookings'];
      for (const path of reads) {
        expect((await agent().get(path).set(auth(mine.token))).status, path).toBe(403);
      }

      expect((await agent().post('/cars').set(auth(mine.token)).send({})).status).toBe(403);
      expect((await agent().post('/uploads').set(auth(mine.token))).status).toBe(403);
      expect(
        (await agent().post('/partners').set(auth(mine.token)).send({ name: 'x' })).status,
      ).toBe(403);
    });

    it('cannot read a car through the admin detail route even when it is theirs', async () => {
      const mine = await createPartnerWithAccount();
      const car = await createCar({ partnerId: mine.partner.id });

      // Owning the row is not the same as holding `cars:READ`. The portal is
      // the only way in, and it decides what a partner sees of it.
      expect((await agent().get(`/cars/${car.id}`).set(auth(mine.token))).status).toBe(403);
    });
  });

  describe('assignment', () => {
    it('moves a car between portals when staff reassign it', async () => {
      const mine = await createPartnerWithAccount();
      const theirs = await createPartnerWithAccount();
      const car = await createCar({ partnerId: theirs.partner.id });

      expect((await agent().get('/portal/cars').set(auth(mine.token))).body.total).toBe(0);

      await prisma.car.update({ where: { id: car.id }, data: { partnerId: mine.partner.id } });

      expect((await agent().get('/portal/cars').set(auth(mine.token))).body.total).toBe(1);
      expect((await agent().get('/portal/cars').set(auth(theirs.token))).body.total).toBe(0);
    });

    it('leaves the car in the catalogue when its partner is deleted', async () => {
      const partner = await createPartner();
      const car = await createCar({ partnerId: partner.id });

      await prisma.partner.delete({ where: { id: partner.id } });

      // SetNull, not Cascade: losing a dealer should not delete the inventory.
      const after = await prisma.car.findUnique({ where: { id: car.id } });
      expect(after).not.toBeNull();
      expect(after?.partnerId).toBeNull();
    });

    it('removes bookings with the partner they belong to', async () => {
      const partner = await createPartner();
      await createBooking(partner.id);

      await prisma.partner.delete({ where: { id: partner.id } });

      expect(await prisma.booking.count({ where: { partnerId: partner.id } })).toBe(0);
    });
  });
});
