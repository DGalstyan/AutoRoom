'use client';

import { useEffect, useState } from 'react';
import { interpolate } from '@/lib/messages';
import type { Locale } from '@/lib/i18n';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';

/**
 * USA S5 — "Տեղական ժամը ԱՄՆ նահանգներում". Pixel-matched to Figma node
 * 218:719's card (verified via the Dev Mode Code panel): white card,
 * `border-radius: 48px`, `padding: 64px`, `gap: 24px`; city label is
 * Labels/Label-L-Regular (16px/24px); the big time is Headings/H1-Light Mid
 * (44px/58px, weight ~300 — the same style `home-h2` already encodes) and
 * the date line is Headings/H1-Reg (24px/36px). Figma's own design is
 * exactly these two cards — "Yerevan, Armenia" and "Los Angeles" — side by
 * side, no more; an earlier pass here added Chicago and New York for
 * "usefulness," which was scope this component was never asked to add.
 * The "diff vs Armenia" caption on the second card isn't in Figma's own
 * layout either, but is kept — it's the one thing `references/pages.md`'s
 * S5 spec explicitly calls for that two side-by-side clocks don't already
 * make obvious on their own.
 */

interface CityClock {
  key: string;
  cityKey: 'yerevan' | 'losAngeles';
  timeZone: string;
  isReference?: boolean;
}

const CITIES: CityClock[] = [
  { key: 'yerevan', cityKey: 'yerevan', timeZone: 'Asia/Yerevan', isReference: true },
  { key: 'losAngeles', cityKey: 'losAngeles', timeZone: 'America/Los_Angeles' },
];

const LOCALE_TAG: Record<Locale, string> = { hy: 'hy-AM', en: 'en-US', ru: 'ru-RU' };

/** Chrome/V8's bundled ICU data has no Armenian locale at all —
 * `Intl.DateTimeFormat.supportedLocalesOf(['hy-AM'])` comes back empty, and
 * `{weekday:'long', month:'long'}` silently falls back to English instead of
 * throwing. `hour`/`minute` digits and the AM/PM marker degrade harmlessly,
 * but weekday/month *names* don't, so those two are hand-translated here
 * from Intl's own (always-supported) `en-US` long names rather than trusted
 * to the `hy-AM` formatter directly. */
const WEEKDAYS_HY: Record<string, string> = {
  Sunday: 'Կիրակի',
  Monday: 'Երկուշաբթի',
  Tuesday: 'Երեքշաբթի',
  Wednesday: 'Չորեքշաբթի',
  Thursday: 'Հինգշաբթի',
  Friday: 'Ուրբաթ',
  Saturday: 'Շաբաթ',
};

const MONTHS_HY: Record<string, string> = {
  January: 'Հունվարի',
  February: 'Փետրվարի',
  March: 'Մարտի',
  April: 'Ապրիլի',
  May: 'Մայիսի',
  June: 'Հունիսի',
  July: 'Հուլիսի',
  August: 'Օգոստոսի',
  September: 'Սեպտեմբերի',
  October: 'Հոկտեմբերի',
  November: 'Նոյեմբերի',
  December: 'Դեկտեմբերի',
};

function formatLocalizedDate(date: Date, timeZone: string, locale: Locale): string {
  if (locale !== 'hy') {
    return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
      timeZone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = WEEKDAYS_HY[get('weekday')] ?? get('weekday');
  const month = MONTHS_HY[get('month')] ?? get('month');
  return `${weekday}, ${month} ${get('day')}`;
}

/** The offset trick: format the same instant *as if* `timeZone`'s wall-clock
 * fields were UTC, then diff that against the real UTC instant — works
 * correctly across DST without a timezone-data library. */
function utcOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return (asUtc - date.getTime()) / 60_000;
}

export function UsaStateClocks() {
  const t = useMessages().usa.stateClocks;
  const locale = useLocale();
  // Starts null so the server's markup and the client's first hydration
  // pass render identically (see `PromoCountdown`'s doc comment for why
  // computing a live clock value during render, rather than in an effect,
  // is a reproducible hydration mismatch) — the real times fill in a tick
  // later, imperceptibly.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Deferred a tick so this isn't a synchronous setState-in-effect (same
    // pattern as `PromoCountdown`'s own first tick).
    queueMicrotask(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const referenceOffset = now ? utcOffsetMinutes('Asia/Yerevan', now) : 0;

  return (
    <div className="flex flex-col items-center gap-16">
      <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>
      <div className="flex flex-wrap items-stretch justify-center gap-8">
        {CITIES.map((city) => {
          const diffHours = now
            ? Math.round((utcOffsetMinutes(city.timeZone, now) - referenceOffset) / 60)
            : 0;
          return (
            <div
              key={city.key}
              className="flex w-full max-w-[300px] flex-col items-start gap-6 rounded-[48px] bg-white p-8 shadow-card sm:p-12"
            >
              <p className="text-lead text-ink">{t.cities[city.cityKey]}</p>
              <div className="flex flex-col gap-1">
                <p className="font-display text-home-h2 font-light text-ink">
                  {now
                    ? new Intl.DateTimeFormat(LOCALE_TAG[locale], {
                        timeZone: city.timeZone,
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }).format(now)
                    : '—'}
                </p>
                <p className="text-lead text-ink/70">
                  {now ? formatLocalizedDate(now, city.timeZone, locale) : '—'}
                </p>
                {!city.isReference && now && (
                  <p className="text-caption text-ink/50">
                    {interpolate(t.diff, {
                      hours: diffHours > 0 ? `+${diffHours}` : `${diffHours}`,
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
