'use client';

import type { Locale } from '@/lib/i18n';
import { useEnabledLocales, useLocale, useSetLocale } from '@/components/shared/LocaleProvider';

// The design (Figma 436:2097) lists the languages as plain text, English first.
const LABELS: Record<Locale, string> = { en: 'En', hy: 'Arm', ru: 'Ru' };
const ORDER: Locale[] = ['en', 'hy', 'ru'];

/**
 * Footer "Languages" list — En / Arm / Ru as plain text buttons: the current
 * language in white, the others in #8f9fa3. Only the locales an admin has
 * enabled are offered; renders nothing when there is just one.
 */
export function FooterLanguages({ heading }: { heading: string }) {
  const locale = useLocale();
  const enabled = useEnabledLocales();
  const { setLocale, isPending } = useSetLocale();
  const options = ORDER.filter((code) => enabled.includes(code));
  if (options.length <= 1) return null;

  return (
    <div className="flex flex-col items-end gap-[15px]">
      <p className="text-[12px] font-medium leading-4 text-white">{heading}</p>
      <ul className="flex items-start gap-5">
        {options.map((code) => (
          <li key={code}>
            <button
              type="button"
              lang={code}
              aria-pressed={locale === code}
              disabled={isPending}
              onClick={() => setLocale(code)}
              className={`inline-flex min-h-11 min-w-8 items-center justify-center text-[14px] leading-5 transition-colors duration-micro hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${
                locale === code ? 'text-white' : 'text-[#8f9fa3]'
              }`}
            >
              {LABELS[code]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
