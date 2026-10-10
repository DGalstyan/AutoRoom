import { describe, expect, it } from 'vitest';
import {
  buildAddends,
  buildPriceFormula,
  countUpValue,
  resolveJourney,
  sumChips,
} from '@/lib/priceJourney';

// Li Auto L9 — the car whose formula used to end in "= 0 $".
const LI_L9 = [{ amount: 52000 }, { amount: 4300 }, { amount: 9800 }, { amount: 2500 }];

describe('sumChips', () => {
  it('adds every chip', () => {
    expect(sumChips(LI_L9)).toBe(68600);
  });
  it('is 0 for no chips', () => {
    expect(sumChips([])).toBe(0);
  });
  it('treats a non-finite amount as 0 instead of returning NaN', () => {
    expect(sumChips([{ amount: 100 }, { amount: Number.NaN }, { amount: Infinity }])).toBe(100);
  });
});

describe('countUpValue', () => {
  it('starts at 0, ends exactly at the total', () => {
    expect(countUpValue(68600, 0)).toBe(0);
    expect(countUpValue(68600, 1)).toBe(68600);
  });
  it('clamps progress outside 0–1', () => {
    expect(countUpValue(68600, 5)).toBe(68600);
    expect(countUpValue(68600, -1)).toBe(0);
  });
  it('interpolates in between', () => {
    expect(countUpValue(1000, 0.5)).toBe(500);
  });
});

describe('buildPriceFormula', () => {
  it('ends in the real sum by default, never 0 $', () => {
    expect(buildPriceFormula(LI_L9)).toBe('52,000 $ + 4,300 $ + 9,800 $ + 2,500 $ = 68,600 $');
  });
  it('shows a mid-animation total when given one', () => {
    expect(buildPriceFormula(LI_L9, 100)).toMatch(/= 100 \$$/);
  });
});

describe('buildAddends', () => {
  it('lists the chips without the total', () => {
    expect(buildAddends(LI_L9)).toBe('52,000 $ + 4,300 $ + 9,800 $ + 2,500 $');
  });
});

// Li Auto L9 as entered in admin: the 4th chip ("Total in Armenia") already is the total.
const LI_L9_LIVE = [{ amount: 45000 }, { amount: 37000 }, { amount: 1200 }, { amount: 83200 }];

describe('resolveJourney', () => {
  it('treats a last chip equal to the sum of the others as the total (Li Auto L9)', () => {
    const { addends, total } = resolveJourney(LI_L9_LIVE);
    expect(addends).toHaveLength(3);
    expect(total).toBe(83200);
  });
  it('does not double-count: the L9 formula is 45,000 + 37,000 + 1,200 = 83,200, never 166,400 or 0', () => {
    expect(buildPriceFormula(LI_L9_LIVE)).toBe('45,000 $ + 37,000 $ + 1,200 $ = 83,200 $');
    expect(buildAddends(LI_L9_LIVE)).toBe('45,000 $ + 37,000 $ + 1,200 $');
  });
  it('sums every chip when the last one is a real addend', () => {
    expect(resolveJourney(LI_L9)).toEqual({ addends: LI_L9, total: 68600 });
  });
  it('tolerates a $1 rounding difference in an entered total', () => {
    expect(resolveJourney([{ amount: 100 }, { amount: 50 }, { amount: 151 }]).total).toBe(151);
  });
  it('is never 0 for non-zero chips, and 0 only for none', () => {
    expect(resolveJourney(LI_L9_LIVE).total).toBeGreaterThan(0);
    expect(resolveJourney([])).toEqual({ addends: [], total: 0 });
  });
  it('ignores non-finite amounts instead of returning NaN', () => {
    expect(resolveJourney([{ amount: 10 }, { amount: Number.NaN }, { amount: 5 }]).total).toBe(15);
  });
  it('count-up always ends on the resolved total', () => {
    expect(countUpValue(resolveJourney(LI_L9_LIVE).total, 1)).toBe(83200);
  });
});
