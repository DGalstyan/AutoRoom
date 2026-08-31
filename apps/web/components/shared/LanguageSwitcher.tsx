'use client';

import type { Locale } from '@/lib/i18n';
import { useEnabledLocales, useLocale, useSetLocale } from '@/components/shared/LocaleProvider';

const LABELS: Record<Locale, string> = { hy: 'ՀԱՅ', en: 'EN', ru: 'РУС' };

/**
 * Header language toggle. Only offers the locales the admin has enabled
 * (`localization.locales` setting) — not necessarily all of
 * `SUPPORTED_LOCALES` — and renders nothing at all when only one locale is
 * enabled, since a switcher with a single option isn't a switcher. Writes
 * the visitor's choice as a cookie (`setLocaleAction`) and refreshes the
 * current route so every Server Component re-renders in the new language.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const enabledLocales = useEnabledLocales();
  const { setLocale, isPending } = useSetLocale();

  if (enabledLocales.length <= 1) return null;

  return (
    <div
      role="group"
      aria-label="Language"
      className={`flex items-center gap-1 rounded-pill bg-white/10 p-1 ${className}`}
    >
      {enabledLocales.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          disabled={isPending}
          onClick={() => setLocale(code)}
          className={`rounded-pill px-3 py-1.5 text-[13px] font-medium transition-colors duration-standard disabled:opacity-60 ${
            locale === code ? 'bg-accent text-ink' : 'text-white hover:bg-white/10'
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
