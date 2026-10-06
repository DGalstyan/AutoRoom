import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CarDetailHero } from '@/components/shared/CarDetailHero';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';
import type { Car } from '@/lib/types/car';

const openUniversal = vi.fn();
vi.mock('@/components/shared/LeadWidgetProvider', () => ({
  useLeadWidgets: () => ({ openUniversal, openQuiz: vi.fn(), isAnyOpen: false }),
}));
vi.mock('@/components/shared/CompareProvider', () => ({
  useCompare: () => ({ openPicker: vi.fn() }),
}));
vi.mock('@/components/shared/CarGallery', () => ({ CarGallery: () => null }));
vi.mock('@/components/shared/CarSpecs', () => ({ CarSpecs: () => null }));
vi.mock('@/components/shared/BuyWithLoan', () => ({ BuyWithLoan: () => null }));

const t = getMessagesForLocale('hy').common.carDetail;

function car(overrides: Partial<Car> = {}): Car {
  return {
    id: 'car_1',
    slug: 'li-auto-l9',
    origin: 'CHINA',
    make: 'Li Auto',
    model: 'L9',
    year: 2025,
    powertrain: 'HYBRID',
    vin: 'LW433B1K5N1000001',
    lotNumber: '58392011',
    price: 52000,
    condition: 'ON_ROAD',
    deliveryEtaDays: 20,
    financingAvailable: true,
    featured: false,
    colors: [],
    priceJourney: [],
    images: [],
    similarCars: [],
    publishedAt: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as Car;
}

describe('CarDetailHero — "Reserve before it arrives"', () => {
  beforeEach(() => openUniversal.mockClear());

  it('shows the button on a car that is on the road, and sends vehicle data, VIN, lot and arrival day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 7, 12));
    renderWithLocale(<CarDetailHero car={car()} banks={[]} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t.ctaReserve) }));
    vi.useRealTimers();

    expect(openUniversal).toHaveBeenCalledTimes(1);
    const arg = openUniversal.mock.calls[0]![0];
    expect(arg.sourceCta).toBe('car-detail-reserve-before-arrival');
    expect(arg.car).toMatchObject({
      id: 'car_1',
      name: 'Li Auto L9',
      vin: 'LW433B1K5N1000001',
      lot: '58392011',
      price: '52,000 $',
      arrivalDate: '2026-10-27',
    });
  });

  it('is not offered for in-stock, on-order or auction cars', () => {
    for (const condition of ['IN_STOCK', 'ON_ORDER', 'AUCTION'] as const) {
      const { unmount } = renderWithLocale(<CarDetailHero car={car({ condition })} banks={[]} />);
      expect(screen.queryByRole('button', { name: new RegExp(t.ctaReserve) })).toBeNull();
      expect(screen.getByRole('button', { name: new RegExp(t.ctaOffer) })).toBeInTheDocument();
      unmount();
    }
  });

  it('still reserves when the ETA is unknown — just without an arrival day', () => {
    renderWithLocale(<CarDetailHero car={car({ deliveryEtaDays: null })} banks={[]} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t.ctaReserve) }));
    expect(openUniversal.mock.calls[0]![0].car.arrivalDate).toBeUndefined();
  });
});
