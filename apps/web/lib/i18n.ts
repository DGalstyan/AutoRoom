/**
 * Locale resolution + message loading — the second half of the i18n
 * scaffolding `lib/messages.ts`'s doc comment always pointed at ("the seam a
 * second locale would plug into later"). `messages.ts` still holds the pure
 * `interpolate` helper; this file owns everything that varies per request.
 *
 * Every locale's JSON is imported once at module load (they're small, and
 * bundling all three is simpler and faster than a runtime `import()` per
 * request) and looked up per request by `getLocale()`'s result — never a
 * module-level `messages.xxx` constant, which would freeze every request to
 * whichever locale happened to import the module first.
 */

import { cookies } from 'next/headers';
import hy from '@/messages/hy.json';
import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import { getLocalizationSettings } from '@/lib/settings';

export const SUPPORTED_LOCALES = ['hy', 'en', 'ru'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Shape of one locale's message tree — `hy.json` is the reference structure. */
export type Messages = typeof hy;

export const LOCALE_COOKIE = 'locale';

const MESSAGES: Record<Locale, Messages> = { hy, en, ru };

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getMessagesForLocale(locale: Locale): Messages {
  return MESSAGES[locale];
}

/**
 * Server-only. Resolves the active locale: the visitor's cookie if it's set
 * and still enabled, else the admin-managed default (`localization.locales`),
 * else `hy` as the hard fallback so a settings-fetch failure never breaks the
 * page. Never throws.
 */
export async function getLocale(): Promise<Locale> {
  const [store, localization] = await Promise.all([cookies(), getLocalizationSettings()]);
  const cookieValue = store.get(LOCALE_COOKIE)?.value;

  if (cookieValue && isLocale(cookieValue) && localization.enabledLocales.includes(cookieValue)) {
    return cookieValue;
  }
  if (
    isLocale(localization.defaultLocale) &&
    localization.enabledLocales.includes(localization.defaultLocale)
  ) {
    return localization.defaultLocale;
  }
  return 'hy';
}

/**
 * Server-only convenience for the root layout: the resolved locale, its
 * message tree, and which locales the switcher should offer (the
 * admin-managed `enabledLocales` — not necessarily all of `SUPPORTED_LOCALES`)
 * in one call.
 */
export async function getServerMessages(): Promise<{
  locale: Locale;
  messages: Messages;
  enabledLocales: Locale[];
}> {
  const [locale, localization] = await Promise.all([getLocale(), getLocalizationSettings()]);
  const enabledLocales = localization.enabledLocales.filter(isLocale);
  return {
    locale,
    messages: getMessagesForLocale(locale),
    enabledLocales: enabledLocales.length > 0 ? enabledLocales : ['hy'],
  };
}
