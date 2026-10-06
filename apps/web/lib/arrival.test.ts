import { describe, expect, it } from 'vitest';
import { arrivalDateFromEta, formatArrivalDate } from '@/lib/arrival';

const NOW = new Date(2026, 9, 7, 15, 30); // 7 Oct 2026, afternoon (local)

describe('arrivalDateFromEta', () => {
  it('adds the ETA days to today as a plain YYYY-MM-DD', () => {
    expect(arrivalDateFromEta(30, NOW)).toBe('2026-11-06');
    expect(arrivalDateFromEta(0, NOW)).toBe('2026-10-07');
  });
  it('rolls over month and year ends', () => {
    expect(arrivalDateFromEta(25, new Date(2026, 11, 20))).toBe('2027-01-14');
  });
  it('is undefined without a usable ETA', () => {
    expect(arrivalDateFromEta(null, NOW)).toBeUndefined();
    expect(arrivalDateFromEta(undefined, NOW)).toBeUndefined();
    expect(arrivalDateFromEta(-3, NOW)).toBeUndefined();
    expect(arrivalDateFromEta(Number.NaN, NOW)).toBeUndefined();
  });
});

describe('formatArrivalDate', () => {
  it('shows dd.mm.yyyy', () => {
    expect(formatArrivalDate('2026-11-06')).toBe('06.11.2026');
  });
});
