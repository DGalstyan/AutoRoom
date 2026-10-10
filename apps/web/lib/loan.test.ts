import { describe, expect, it } from 'vitest';
import { computeMonthlyPaymentAmd, explainLoan } from '@/lib/loan';

describe('explainLoan', () => {
  const finance = {
    termMonths: 60,
    nominalRate: 15.9,
    usdToAmd: 390,
    minDownPaymentRatio: 0.1,
    maxDownPaymentRatio: 0.7,
  };

  it('reports the min / current / max down payment with their share of the price', () => {
    const e = explainLoan(50000, 10000, finance);
    expect([e.minUsd, e.downUsd, e.maxUsd]).toEqual([5000, 10000, 35000]);
    expect([e.minPct, e.downPct, e.maxPct]).toEqual([10, 20, 70]);
  });
  it('clamps a down payment outside the allowed range, like the slider does', () => {
    expect(explainLoan(50000, 100, finance).downUsd).toBe(5000);
    expect(explainLoan(50000, 99999, finance).downUsd).toBe(35000);
  });
  it('shows the loan amount as (price − down) × rate', () => {
    const e = explainLoan(50000, 10000, finance);
    expect(e.principalUsd).toBe(40000);
    expect(e.principalAmd).toBe(40000 * 390);
  });
  it('shows the monthly rate as the yearly rate ÷ 12', () => {
    expect(explainLoan(50000, 10000, finance).monthlyRatePct).toBe(1.325);
  });
  it('agrees with the monthly payment the calculator displays', () => {
    const e = explainLoan(50000, 10000, finance);
    expect(e.monthlyPaymentAmd).toBe(computeMonthlyPaymentAmd(50000, 10000, finance));
    expect(e.monthlyPaymentAmd).toBeGreaterThan(0);
  });
  it('zero rate: a flat split of the loan over the term', () => {
    const e = explainLoan(50000, 10000, { ...finance, nominalRate: 0 });
    expect(e.monthlyPaymentAmd).toBe(Math.round((40000 * 390) / 60));
  });
});
