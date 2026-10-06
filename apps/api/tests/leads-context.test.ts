import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { agent, disconnect, resetData } from './helpers';

/** Every lead widget attaches the same hidden context; the API must keep all of it. */
describe('POST /leads — hidden context', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  const body = (overrides: Record<string, unknown> = {}) => ({
    name: 'Anna',
    phone: '+374 77 123456',
    budget: '20-35k',
    financing: 'need',
    timing: 'now',
    channel: 'viber',
    carName: 'Li Auto L9',
    carId: 'car_123',
    carVin: 'LW433B1K5N1000001',
    carLot: '58392011',
    sourcePage: '/china/li-auto-l9',
    sourceCta: 'car-detail-per-car-offer',
    locale: 'ru',
    device: 'mobile',
    timestamp: '2026-10-07T10:00:00.000Z',
    ...overrides,
  });

  it('stores vehicle id, VIN, lot, page, CTA, language, device and the visitor timestamp', async () => {
    const response = await agent().post('/leads').send(body());
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      carId: 'car_123',
      carVin: 'LW433B1K5N1000001',
      carLot: '58392011',
      sourcePage: '/china/li-auto-l9',
      sourceCta: 'car-detail-per-car-offer',
      locale: 'ru',
      device: 'mobile',
      submittedAt: '2026-10-07T10:00:00.000Z',
      budget: '20-35k',
      channel: 'viber',
    });
    const row = await prisma.lead.findFirstOrThrow();
    expect(row.carId).toBe('car_123');
    expect(row.carLot).toBe('58392011');
    expect(row.submittedAt?.toISOString()).toBe('2026-10-07T10:00:00.000Z');
  });

  it('a general lead (no vehicle) still saves, with the vehicle fields null', async () => {
    const response = await agent()
      .post('/leads')
      .send(body({ carId: '', carVin: '', carLot: '', carName: '', timestamp: undefined }));
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      carId: null,
      carVin: null,
      carLot: null,
      submittedAt: null,
    });
  });

  it('rejects a malformed timestamp', async () => {
    const response = await agent()
      .post('/leads')
      .send(body({ timestamp: 'yesterday' }));
    expect(response.status).toBe(400);
  });
});
