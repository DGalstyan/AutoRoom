/**
 * Pure amortization math for `LoanCalculator` — kept out of the component so
 * the formula is one small, testable function rather than buried in a
 * `useMemo`. Standard fixed-rate annuity: `M = P·r(1+r)^n / ((1+r)^n − 1)`,
 * falling back to a flat split when the rate is zero (the formula's
 * denominator would otherwise be zero).
 */

import type { FinanceCalculator } from '@/lib/types/car';

/**
 * @param priceUsd Car price in USD.
 * @param downPaymentUsd Down payment in USD, already clamped to
 *   `[price * minDownPaymentRatio, price * maxDownPaymentRatio]` by the caller.
 * @returns Monthly payment in AMD, rounded to the nearest unit.
 */
export function computeMonthlyPaymentAmd(
  priceUsd: number,
  downPaymentUsd: number,
  finance: Pick<FinanceCalculator, 'termMonths' | 'nominalRate' | 'usdToAmd'>,
): number {
  const principalAmd = Math.max(0, priceUsd - downPaymentUsd) * finance.usdToAmd;
  const monthlyRate = finance.nominalRate / 100 / 12;
  const n = finance.termMonths;

  if (n <= 0) return 0;
  if (monthlyRate === 0) return Math.round(principalAmd / n);

  const factor = (1 + monthlyRate) ** n;
  return Math.round((principalAmd * monthlyRate * factor) / (factor - 1));
}

export function formatAmd(amount: number): string {
  return `AMD ${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Every number behind the monthly figure, so the calculator can show its working. The same
 * annuity inputs as `computeMonthlyPaymentAmd`: `monthlyPaymentAmd` here IS that function's
 * result, so the explanation can never disagree with the figure above it.
 */
export function explainLoan(
  priceUsd: number,
  downPaymentUsd: number,
  finance: Pick<
    FinanceCalculator,
    'termMonths' | 'nominalRate' | 'usdToAmd' | 'minDownPaymentRatio' | 'maxDownPaymentRatio'
  >,
) {
  const minUsd = Math.round(priceUsd * finance.minDownPaymentRatio);
  const maxUsd = Math.round(priceUsd * finance.maxDownPaymentRatio);
  const downUsd = Math.min(maxUsd, Math.max(minUsd, downPaymentUsd));
  const pct = (usd: number) => (priceUsd > 0 ? Math.round((usd / priceUsd) * 1000) / 10 : 0);
  const principalUsd = Math.max(0, priceUsd - downUsd);
  return {
    minUsd,
    maxUsd,
    downUsd,
    minPct: pct(minUsd),
    maxPct: pct(maxUsd),
    downPct: pct(downUsd),
    principalUsd,
    principalAmd: principalUsd * finance.usdToAmd,
    /** Percent per month, e.g. 15.9 % a year → 1.325. */
    monthlyRatePct: Math.round((finance.nominalRate / 12) * 1000) / 1000,
    termMonths: finance.termMonths,
    monthlyPaymentAmd: computeMonthlyPaymentAmd(priceUsd, downUsd, finance),
  };
}
