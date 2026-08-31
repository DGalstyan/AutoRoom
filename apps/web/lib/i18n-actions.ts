'use server';

/**
 * The only way a locale change reaches the server: a client component (the
 * language switcher) calls this, we set the cookie `lib/i18n.ts` reads, and
 * the caller does `router.refresh()` to re-render the current route tree
 * with the new locale's messages. Kept in its own file — a `'use server'`
 * file exports nothing but actions, so it can't accidentally expose
 * `lib/i18n.ts`'s other helpers as callable endpoints.
 */

import { cookies } from 'next/headers';
import { isLocale, LOCALE_COOKIE } from '@/lib/i18n';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  });
}
