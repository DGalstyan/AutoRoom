/**
 * Server-only fetch of the public subset of admin-managed settings
 * (`apps/api`'s `GET /settings/public`) — currently `finance.calculator`
 * (drives the real-time `LoanCalculator` on car detail pages: term, rates,
 * down-payment bounds, USD→AMD rate), `localization.locales` (which
 * languages the site offers and which one it opens in — `lib/i18n.ts`'s
 * `getLocale()`), and `features.toggles`'s `maintenanceMode` (the site-wide
 * notice `RootLayout` swaps in). Mirrors `lib/cars.ts`'s never-throws contract: an
 * unreachable API falls back to the same defaults the backend registry ships
 * (`apps/api/src/lib/settings.ts`), so every consumer always gets something
 * reasonable rather than nothing. Next.js dedupes identical `fetch` calls
 * within one request, so both getters hitting the same URL costs one request.
 */

import { cookies } from 'next/headers';
import type { FinanceCalculator } from '@/lib/types/car';
import type { Locale } from '@/lib/i18n';
import { MAINTENANCE_PREVIEW_COOKIE } from '@/lib/maintenancePreviewCookie';

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
  'features.toggles'?: { maintenanceMode: boolean };
}

async function fetchPublicSettings(
  options: { fresh?: boolean } = {},
): Promise<PublicSettingsResponse | null> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    // `fresh` trades the usual 5-minute window for a 10-second one rather
    // than `cache: 'no-store'`: a *cached* stale rate for 5 minutes is a
    // rounding error, but a cached maintenance flag is 5 minutes of visitors
    // seeing the site the toggle just told them was down — the Settings
    // screen's own copy promises "Changes apply on the next page load." A
    // true `no-store` would fix that too, but forces every page through this
    // layout into full per-request rendering; 10s keeps ISR/static caching
    // intact everywhere else while making the toggle feel effectively live.
    const res = await fetch(`${base}/settings/public`, {
      next: { revalidate: options.fresh ? 10 : 300 },
    });
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

/** Drives `RootLayout`'s site-wide maintenance notice — see its own comment. */
export async function isMaintenanceMode(): Promise<boolean> {
  const data = await fetchPublicSettings({ fresh: true });
  return data?.['features.toggles']?.maintenanceMode ?? false;
}

/** Set by `MaintenanceNotice`'s double-click escape hatch (`MAINTENANCE_PREVIEW_COOKIE`)
 * — a session cookie, not a real access control, so whoever knows the trick
 * can preview the site while `maintenanceMode` stays on for every other visitor. */
export async function hasMaintenancePreview(): Promise<boolean> {
  const store = await cookies();
  return store.get(MAINTENANCE_PREVIEW_COOKIE)?.value === '1';
}
