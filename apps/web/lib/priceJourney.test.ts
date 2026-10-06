import { describe, expect, it } from 'vitest';
import { buildAddends, buildPriceFormula, countUpValue, sumChips } from '@/lib/priceJourney';

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
