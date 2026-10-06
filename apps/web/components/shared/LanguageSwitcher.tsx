'use client';

import type { Locale } from '@/lib/i18n';
import {
  useEnabledLocales,
  useLocale,
  useMessages,
  useSetLocale,
} from '@/components/shared/LocaleProvider';

const LABELS: Record<Locale, string> = { hy: 'ՀԱՅ', en: 'EN', ru: 'РУС' };

/**
 * Header language toggle. Only offers the locales the admin has enabled
 * (`localization.locales` setting) — not necessarily all of
 * `SUPPORTED_LOCALES` — and renders nothing at all when only one locale is
 * enabled, since a switcher with a single option isn't a switcher. Writes
 * the visitor's choice as a cookie (`setLocaleAction`) and refreshes the
 * current route so every Server Component re-renders in the new language.
 *
 * `tone='light'` (the partner portal's white header, same split as
 * `BrandLogo`'s — see `Header.tsx`'s `isLightHeader`) swaps the translucent
 * white pill/text for an ink-tinted one: the default `bg-white/10` pill and
 * `text-white` inactive labels are only visible against a dark surface, and
 * read as invisible (white-on-white) on a light one.
 */
export function LanguageSwitcher({
  className = '',
  tone = 'dark',
}: {
  className?: string;
  tone?: 'dark' | 'light';
}) {
  const locale = useLocale();
  const enabledLocales = useEnabledLocales();
  const { setLocale, isPending } = useSetLocale();
  const languageLabel = useMessages().common.languageLabel;

  if (enabledLocales.length <= 1) return null;

  return (
    <div
      role="group"
      aria-label={languageLabel}
      className={`flex items-center gap-1 rounded-pill p-1 ${tone === 'light' ? 'bg-ink/5' : 'bg-white/10'} ${className}`}
    >
      {enabledLocales.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          disabled={isPending}
          onClick={() => setLocale(code)}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-[13px] font-medium transition-colors duration-standard disabled:opacity-60 ${
            locale === code
              ? 'bg-accent text-ink'
              : tone === 'light'
                ? 'text-ink hover:bg-ink/5'
                : 'text-white hover:bg-white/10'
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
