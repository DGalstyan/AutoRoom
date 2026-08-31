/**
 * Server-only fetch of the public subset of admin-managed settings
 * (`apps/api`'s `GET /settings/public`) — currently `finance.calculator`
 * (drives the real-time `LoanCalculator` on car detail pages: term, rates,
 * down-payment bounds, USD→AMD rate) and `localization.locales` (which
 * languages the site offers and which one it opens in — `lib/i18n.ts`'s
 * `getLocale()`). Mirrors `lib/cars.ts`'s never-throws contract: an
 * unreachable API falls back to the same defaults the backend registry ships
 * (`apps/api/src/lib/settings.ts`), so every consumer always gets something
 * reasonable rather than nothing. Next.js dedupes identical `fetch` calls
 * within one request, so both getters hitting the same URL costs one request.
 */

import type { FinanceCalculator } from '@/lib/types/car';
import type { Locale } from '@/lib/i18n';

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

export interface LocalizationSettings {
  defaultLocale: Locale;
  enabledLocales: Locale[];
}

const LOCALIZATION_DEFAULTS: LocalizationSettings = {
  defaultLocale: 'hy',
  enabledLocales: ['hy'],
};

interface PublicSettingsResponse {
  'finance.calculator'?: FinanceCalculator;
  'localization.locales'?: LocalizationSettings;
}

async function fetchPublicSettings(): Promise<PublicSettingsResponse | null> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/settings/public`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as PublicSettingsResponse;
  } catch {
    return null;
  }
}

export async function getFinanceCalculatorSettings(): Promise<FinanceCalculator> {
  const data = await fetchPublicSettings();
  return data?.['finance.calculator'] ?? FINANCE_CALCULATOR_DEFAULTS;
}

export async function getLocalizationSettings(): Promise<LocalizationSettings> {
  const data = await fetchPublicSettings();
  return data?.['localization.locales'] ?? LOCALIZATION_DEFAULTS;
}
