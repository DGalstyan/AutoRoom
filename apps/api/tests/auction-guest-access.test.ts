import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { signGuestAccess } from '../src/lib/guestAccess';
import { agent, createCar, disconnect, resetData } from './helpers';

/**
 * The View-Only link is never in the public car JSON; a visitor gets a time-limited token
 * that resolves to it only while valid.
 */
describe('auction guest access', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  const link = 'https://www.copart.com/lot/58392011';
  const auctionCar = () =>
    createCar({
      slug: 'auction-bmw',
      condition: 'AUCTION',
      auctionPlatform: 'COPART',
      auctionViewUrl: link,
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

  it('keeps the link out of the public list and detail, and says only that access exists', async () => {
    await auctionCar();
    const detail = await agent().get('/public/cars/auction-bmw');
    expect(detail.body.auctionViewUrl).toBeNull();
    expect(detail.body.hasGuestAccess).toBe(true);
    expect(JSON.stringify((await agent().get('/public/cars')).body)).not.toContain(link);
  });

  it('issues a token that resolves to the link while valid', async () => {
    await auctionCar();
    const issued = await agent().post('/public/cars/auction-bmw/guest-access');
    expect(issued.status).toBe(200);
    expect(issued.body.ttlMinutes).toBe(60);
    expect(JSON.stringify(issued.body)).not.toContain(link);

    const resolved = await agent().get(`/public/auction-access/${issued.body.token}`);
    expect(resolved.status).toBe(200);
    expect(resolved.body.url).toBe(link);
  });

  it('answers 410 once the token has expired and 404 for a forged one', async () => {
    const car = await auctionCar();
    const { token } = signGuestAccess(car.id, 5, Date.now() - 10 * 60_000);
    expect((await agent().get(`/public/auction-access/${token}`)).status).toBe(410);
    expect((await agent().get('/public/auction-access/forged.token')).status).toBe(404);
  });

  it('issues nothing for a car without a link or that is not an auction car', async () => {
    await createCar({ slug: 'plain', publishedAt: new Date('2026-01-01T00:00:00.000Z') });
    expect((await agent().post('/public/cars/plain/guest-access')).status).toBe(404);
    expect((await agent().post('/public/cars/missing/guest-access')).status).toBe(404);
  });
});
