import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLeadHidden } from '@/lib/leads';

describe('buildLeadHidden', () => {
  afterEach(() => vi.useRealTimers());

  it('carries vehicle id, VIN, lot, page, CTA, language, device and timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T10:00:00.000Z'));
    vi.stubGlobal('innerWidth', 390);

    const hidden = buildLeadHidden({
      sourcePage: '/china/li-auto-l9',
      sourceCta: 'car-detail-per-car-offer',
      locale: 'ru',
      car: { id: 'car_123', name: 'Li Auto L9', vin: 'LW433B1K5N1000001', lot: '58392011' },
    });

    expect(hidden).toEqual({
      sourcePage: '/china/li-auto-l9',
      sourceCta: 'car-detail-per-car-offer',
      car: { id: 'car_123', name: 'Li Auto L9', vin: 'LW433B1K5N1000001', lot: '58392011' },
      timestamp: '2026-10-07T10:00:00.000Z',
      locale: 'ru',
      device: 'mobile',
      quizAnswers: undefined,
    });
  });

  it('omits the vehicle for a general (non-car) lead but still has the rest', () => {
    const hidden = buildLeadHidden({ sourcePage: '/', sourceCta: 'hero', locale: 'hy' });
    expect(hidden.car).toBeUndefined();
    expect(hidden.locale).toBe('hy');
    expect(hidden.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(['mobile', 'tablet', 'desktop']).toContain(hidden.device);
  });

  it('passes quiz answers through', () => {
    const hidden = buildLeadHidden({
      sourcePage: '/',
      sourceCta: 'quiz',
      locale: 'en',
      quizAnswers: { budget: 'lt10k' },
    });
    expect(hidden.quizAnswers).toEqual({ budget: 'lt10k' });
  });
});
