/**
 * Server-only fetch of the public subset of admin-managed settings
 * (`apps/api`'s `GET /settings/public`) — currently used for
 * `finance.calculator`, which drives the real-time `LoanCalculator` on car
 * detail pages (term, rates, down-payment bounds, USD→AMD rate). Mirrors
 * `lib/cars.ts`'s never-throws contract: an unreachable API falls back to the
 * same defaults the backend registry ships (`apps/api/src/lib/settings.ts`),
 * so the calculator always renders something reasonable rather than nothing.
 */

import type { FinanceCalculator } from '@/lib/types/car';

const FINANCE_CALCULATOR_DEFAULTS: FinanceCalculator = {
  termMonths: 60,
  nominalRate: 15.9,
  effectiveRateMin: 17.11,
  effectiveRateMax: 17.19,
  minDownPaymentRatio: 0.1,
  maxDownPaymentRatio: 0.7,
  defaultDownPaymentRatio: 0.2,
  usdToAmd: 390,
  disclaimer: null,
};

interface PublicSettingsResponse {
  'finance.calculator'?: FinanceCalculator;
}

export async function getFinanceCalculatorSettings(): Promise<FinanceCalculator> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/settings/public`, { next: { revalidate: 300 } });
    if (!res.ok) return FINANCE_CALCULATOR_DEFAULTS;

    const data = (await res.json()) as PublicSettingsResponse;
    return data['finance.calculator'] ?? FINANCE_CALCULATOR_DEFAULTS;
  } catch {
    return FINANCE_CALCULATOR_DEFAULTS;
  }
}
