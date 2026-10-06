import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitLead } from '@/lib/actions/leads';
import { buildLeadHidden } from '@/lib/leads';

describe('submitLead', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the full lead context to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const hidden = buildLeadHidden({
      sourcePage: '/usa/auctions/rav4',
      sourceCta: 'auction-contact',
      locale: 'en',
      car: {
        id: 'car_9',
        name: 'Toyota RAV4',
        vin: 'VIN123',
        lot: 'LOT456',
        arrivalDate: '2026-10-27',
      },
    });
    const result = await submitLead({
      answers: { name: 'Anna', phone: '+374 77 123456', budget: '10-20k', channel: 'viber' },
      hidden,
    });

    expect(result.ok).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body).toMatchObject({
      carId: 'car_9',
      carVin: 'VIN123',
      carLot: 'LOT456',
      carArrivalDate: '2026-10-27',
      carName: 'Toyota RAV4',
      sourcePage: '/usa/auctions/rav4',
      sourceCta: 'auction-contact',
      locale: 'en',
      device: hidden.device,
      timestamp: hidden.timestamp,
      budget: '10-20k',
      channel: 'viber',
    });
  });
});
