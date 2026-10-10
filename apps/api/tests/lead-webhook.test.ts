import http from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { signBody } from '../src/lib/leadWebhook';
import { agent, disconnect, resetData } from './helpers';

/** The CRM webhook: every new lead is posted with vehicle id, VIN/lot, page, CTA, language, device and timestamps. */
describe('lead CRM webhook', () => {
  let server: http.Server;
  let received: { headers: http.IncomingHttpHeaders; body: string }[] = [];
  let status = 200;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        received.push({ headers: req.headers, body });
        res.statusCode = status;
        res.end('ok');
      });
    });
    await new Promise<void>((resolve) => server.listen(4599, '127.0.0.1', resolve));
  });
  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await disconnect();
  });
  beforeEach(async () => {
    received = [];
    status = 200;
    await resetData();
  });

  const lead = {
    name: 'Ani',
    phone: '+374 94 077757',
    sourcePage: '/china/zeekr-001-china',
    sourceCta: 'car-detail-per-car-offer',
    locale: 'hy',
    device: 'mobile',
    timestamp: '2026-10-10T08:00:00.000Z',
    carId: 'car_123',
    carName: 'Zeekr 001',
    carVin: 'LW433B1K5N1000001',
    carLot: '58392011',
    carArrivalDate: '2026-10-27',
  };

  async function waitForHook() {
    for (let i = 0; i < 50 && received.length === 0; i++)
      await new Promise((r) => setTimeout(r, 50));
    return received[0];
  }

  it('posts the lead with the full context, signed', async () => {
    const res = await agent().post('/leads').send(lead);
    expect(res.status).toBe(201);

    const hook = await waitForHook();
    expect(hook).toBeDefined();
    const body = JSON.parse(hook!.body);
    expect(body.event).toBe('lead.created');
    expect(body.contact).toMatchObject({ name: 'Ani', phone: '+374 94 077757' });
    expect(body.vehicle).toEqual({
      id: 'car_123',
      name: 'Zeekr 001',
      vin: 'LW433B1K5N1000001',
      lot: '58392011',
      link: null,
      arrivalDate: '2026-10-27',
    });
    expect(body.context).toMatchObject({
      page: '/china/zeekr-001-china',
      cta: 'car-detail-per-car-offer',
      language: 'hy',
      device: 'mobile',
      submittedAt: '2026-10-10T08:00:00.000Z',
    });
    expect(body.context.receivedAt).toBeTruthy();
    expect(hook!.headers['x-autoroom-signature']).toBe(
      signBody(hook!.body, 'test-webhook-secret-0123456789'),
    );
  });

  it('still saves the lead and answers 201 when the CRM is down', async () => {
    status = 500;
    const res = await agent().post('/leads').send(lead);
    expect(res.status).toBe(201);
    await waitForHook();
  });
});
