import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CarCard } from '@/components/shared/CarCard';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';
import type { CarSummary } from '@/lib/types/car';

vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/i18n')>();
  return {
    ...actual,
    getServerMessages: async () => ({
      locale: 'hy' as const,
      messages: actual.getMessagesForLocale('hy'),
      enabledLocales: ['hy' as const],
    }),
  };
});
vi.mock('@/components/shared/CarCompareToggle', () => ({ CarCompareToggle: () => null }));

const t = getMessagesForLocale('hy').common.carCard;

function car(overrides: Partial<CarSummary> = {}): CarSummary {
  return {
    id: 'c1',
    slug: 'mclaren-720s',
    origin: 'USA',
    condition: 'AUCTION',
    make: 'McLaren',
    model: '720S Coupe',
    year: 2020,
    trim: 'Base',
    price: 215000,
    financingAvailable: false,
    images: [],
    ...overrides,
  } as CarSummary;
}

describe('CarCard', () => {
  it('shows an auction car as "Աճուրդ: <platform> Deal" instead of the generic condition', async () => {
    renderWithLocale(await CarCard({ car: car({ auctionPlatform: 'COPART' }) }));
    expect(screen.getByText('Copart Deal')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(t.auctionPrefix))).toBeInTheDocument();
    expect(screen.queryByText(t.conditions.AUCTION)).not.toBeInTheDocument();
  });

  it('falls back to the condition pill when an auction car has no platform yet', async () => {
    renderWithLocale(await CarCard({ car: car({ auctionPlatform: null }) }));
    expect(screen.getByText(t.conditions.AUCTION)).toBeInTheDocument();
  });
});
