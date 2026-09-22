'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { interpolate } from '@/lib/messages';
import type { Locale } from '@/lib/i18n';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';

/**
 * USA S5 — "Տեղական ժամը ԱՄՆ նահանգներում". Two Figma nodes cover this
 * section and disagree on card count: the standalone component 218:719
 * (originally used to pixel-match this file) is exactly two cards —
 * "Yerevan, Armenia" and "Los Angeles"; the full page mock 218:177's own
 * copy of the same row (`Frame 1597885992`) has three — Yerevan/Los
 * Angeles/New York, each with the same card chrome. Re-verified against
 * that full-page node via get_design_context (its numbers below correct a
 * mismatch against this file's own text: card padding is a flat `64px` —
 * this file only ever reached 48px before the `lg:p-16` added below — city
 * label is Labels/Label-L-Regular (16px/24px, not the 20px `text-lead` this
 * file used), the big time is Headings/H1-Light Mid (44px/58px, weight
 * ~300 — the same style `home-h2` already encodes), and the date line is
 * Headings/H1-Reg (24px/36px, also wrongly `text-lead` before). Both the
 * Los Angeles and New York cards there also pair their city label with a
 * small chevron affordance rather than a plain label — reproduced on the
 * picker card below as a custom SVG (the browser's own native `<select>`
 * arrow doesn't match it), `border-radius: 48px`/`gap: 24px` were already
 * correct.
 *
 * Per direct user feedback the second card is a live state picker (a
 * `<select>` of major US states spanning every mainland time zone plus
 * Alaska/Hawaii and DST-less Arizona) rather than a card fixed to Los
 * Angeles forever, so a visitor can check the local time anywhere in the US
 * they actually care about — New York is reachable through it, so the
 * three-card Figma layout isn't reproduced as a third static card.
 * California/Los Angeles stays the default so the page's first paint is
 * unchanged from before. The "diff vs Armenia" caption is kept — it's the
 * one thing `references/pages.md`'s S5 spec explicitly calls for that two
 * side-by-side clocks don't already make obvious on their own.
 *
 * Not reproduced: Figma's decorative analog clock face (a glossy black
 * "Braun"-style dial with rotating hour/minute/second hands) that sits
 * above the digital time in every card — a from-scratch illustration plus
 * live hand-rotation math, not a simple style tweak, so it's left as a
 * known gap pending a product call rather than built unasked.
 */

interface StateOption {
  /** Also the `usa.stateClocks.states` message key. */
  key: string;
  timeZone: string;
}

/**
 * One representative city per state, chosen to cover every US time zone
 * (including DST-less Arizona and Alaska/Hawaii) without listing all 50
 * states' worth of translated labels.
 */
const STATE_OPTIONS: StateOption[] = [
  { key: 'california', timeZone: 'America/Los_Angeles' },
  { key: 'washington', timeZone: 'America/Los_Angeles' },
  { key: 'oregon', timeZone: 'America/Los_Angeles' },
  { key: 'nevada', timeZone: 'America/Los_Angeles' },
  { key: 'colorado', timeZone: 'America/Denver' },
  { key: 'arizona', timeZone: 'America/Phoenix' },
  { key: 'utah', timeZone: 'America/Denver' },
  { key: 'newMexico', timeZone: 'America/Denver' },
  { key: 'texas', timeZone: 'America/Chicago' },
  { key: 'illinois', timeZone: 'America/Chicago' },
  { key: 'louisiana', timeZone: 'America/Chicago' },
  { key: 'minnesota', timeZone: 'America/Chicago' },
  { key: 'newYork', timeZone: 'America/New_York' },
  { key: 'florida', timeZone: 'America/New_York' },
  { key: 'georgia', timeZone: 'America/New_York' },
  { key: 'massachusetts', timeZone: 'America/New_York' },
  { key: 'pennsylvania', timeZone: 'America/New_York' },
  { key: 'alaska', timeZone: 'America/Anchorage' },
  { key: 'hawaii', timeZone: 'Pacific/Honolulu' },
];

const DEFAULT_STATE_KEY = 'california';

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
  const [stateKey, setStateKey] = useState<string>(DEFAULT_STATE_KEY);

  useEffect(() => {
    // Deferred a tick so this isn't a synchronous setState-in-effect (same
    // pattern as `PromoCountdown`'s own first tick).
    queueMicrotask(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const referenceOffset = now ? utcOffsetMinutes('Asia/Yerevan', now) : 0;
  const selectedState =
    STATE_OPTIONS.find((option) => option.key === stateKey) ?? STATE_OPTIONS[0]!;
  const diffHours = now
    ? Math.round((utcOffsetMinutes(selectedState.timeZone, now) - referenceOffset) / 60)
    : 0;

  return (
    <div className="flex flex-col items-center gap-16">
      <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>
      <div className="flex flex-wrap items-stretch justify-center gap-8">
        <ClockCard label={t.cities.yerevan} timeZone="Asia/Yerevan" now={now} locale={locale} />

        <ClockCard
          selector={
            <div className="relative flex w-full items-center">
              <label htmlFor="usa-state-select" className="sr-only">
                {t.stateLabel}
              </label>
              <select
                id="usa-state-select"
                value={stateKey}
                onChange={(event) => setStateKey(event.target.value)}
                className="w-full appearance-none truncate border-none bg-transparent p-0 pr-6 text-[16px] leading-6 text-ink outline-none"
              >
                {STATE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {t.states[option.key as keyof typeof t.states]}
                  </option>
                ))}
              </select>
              {/* Figma's dial cards pair the city label with a small chevron
                affordance — reproduced here rather than the browser's own
                native select arrow, which doesn't match it. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="pointer-events-none absolute right-0 size-5 text-ink"
              >
                <path
                  d="M5 7.5 10 12.5 15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          }
          timeZone={selectedState.timeZone}
          now={now}
          locale={locale}
          diffCaption={
            now
              ? interpolate(t.diff, {
                  hours: diffHours > 0 ? `+${diffHours}` : `${diffHours}`,
                })
              : undefined
          }
        />
      </div>
    </div>
  );
}

function ClockCard({
  label,
  selector,
  timeZone,
  now,
  locale,
  diffCaption,
}: {
  /** Plain city label — the Yerevan reference card. */
  label?: string;
  /** The state `<select>` in place of a plain label — the picker card, so
   * choosing a state happens right inside the card whose time it changes,
   * not from a separate control floating above it (per direct user
   * feedback: the two used to be visually disconnected). */
  selector?: ReactNode;
  timeZone: string;
  now: Date | null;
  locale: Locale;
  /** Present only for the non-reference (selected-state) card. */
  diffCaption?: string;
}) {
  return (
    <div className="flex w-full max-w-[300px] flex-col items-start gap-6 rounded-[48px] bg-white p-8 shadow-card sm:p-12 lg:p-16">
      {selector ?? <p className="text-[16px] leading-6 text-ink">{label}</p>}
      <div className="flex flex-col gap-1">
        <p className="font-display text-home-h2 font-light text-ink">
          {now
            ? new Intl.DateTimeFormat(LOCALE_TAG[locale], {
                timeZone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }).format(now)
            : '—'}
        </p>
        <p className="text-[24px] leading-9 text-ink/70">
          {now ? formatLocalizedDate(now, timeZone, locale) : '—'}
        </p>
        {diffCaption && <p className="text-caption text-ink/50">{diffCaption}</p>}
      </div>
    </div>
  );
}
