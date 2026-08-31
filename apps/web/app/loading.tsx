import { cookies } from 'next/headers';
import { getMessagesForLocale, isLocale, LOCALE_COOKIE } from '@/lib/i18n';

export default async function Loading() {
  // Reads the locale cookie directly rather than `getServerMessages()`
  // (which also fetches the admin `localization.locales` setting): this is
  // the instant Suspense fallback shown while the real page streams in, so
  // it must never itself wait on a network round trip.
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const messages = getMessagesForLocale(
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : 'hy',
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center bg-bg text-white/50"
    >
      <span className="sr-only">{messages.common.loading}</span>
      <span
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-pill border-2 border-white/20 border-t-accent motion-reduce:animate-none"
      />
    </div>
  );
}
