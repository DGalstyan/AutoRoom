'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { interpolate } from '@/lib/messages';
import type { Locale } from '@/lib/i18n';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';
import { dstStatus, hoursAhead, type DstStatus } from '@/lib/zoneTime';

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
 * Headings/H1-Reg (24px/36px, also wrongly `text-lead` before). Figma wraps
 * both the time and date in one container carrying a single, full-opacity
 * `neutral/100 #0d0d0d` (`text-ink` — this file's own `ink` token is
 * literally that hex), so the date line's `text-ink/70` was a real
 * mismatch too, not a deliberate de-emphasis. Both are also "Headings/*"
 * text styles in Figma (this design system maps Headings → the `display`
 * font, Sora; Labels → `body`, Inter — see design-tokens.md), so the date
 * line needs `font-display` alongside the time above it; it had been left
 * on the page's default `font-body`, a real family mismatch, not just a
 * missed weight/size. Both the
 * Los Angeles and New York cards there also pair their city label with a
 * small chevron affordance rather than a plain label — reproduced on the
 * picker card below as a custom SVG (the browser's own native `<select>`
 * arrow doesn't match it), `border-radius: 48px`/`gap: 24px` were already
 * correct.
 *
 * Per direct user feedback the non-Yerevan cards are live state pickers (a
 * `<select>` of major US states spanning every mainland time zone plus
 * Alaska/Hawaii and DST-less Arizona) rather than a card fixed to one city
 * forever, so a visitor can check the local time anywhere in the US they
 * actually care about. Originally this was a single picker card, defaulting
 * to California/Los Angeles, with New York only reachable by opening it —
 * which under-matched the full-page Figma mock's three always-visible
 * cards (Yerevan/Los Angeles/New York) closely enough that a follow-up
 * request flagged New York's time as "missing". Fixed by making it two
 * independent pickers, defaulting to California and New York respectively,
 * so the page's first paint shows exactly Figma's three cities while either
 * one can still be swapped to any other state. The "diff vs Armenia"
 * caption is kept on both — it's the one thing `references/pages.md`'s S5
 * spec explicitly calls for that side-by-side clocks don't already make
 * obvious on their own.
 *
 * The decorative analog dial above the digital time (`AnalogClock` below)
 * is an original glossy-black illustration, not the Figma mock's actual
 * clock-face images: those are stock product photos of a real "Braun"
 * clock (the wordmark is legible on the dial), fine as a design reference
 * but not something to ship as-is on a live commercial site. The tick
 * marks, hour/minute hand shapes and proportions are reproduced from the
 * Dev Mode CSS (gradient white→`#acacac`, `shadow-[0px_4px_4px_...]` drop
 * shadow, `inset_4px_3px_11px` bevel); the second hand is a plain accent
 * pointer rather than the mock's own thin gold "Union" shape, which has no
 * clean vector equivalent in the exported code. All three hands compute
 * their rotation from `now` in the card's own `timeZone`, live — Figma's
 * mock is a single frozen pose, not proof this ever needs to be static.
 *
 * Re-checked again via `get_design_context` on `Frame 39499` (369:1084)
 * directly: the font tokens above (16/24 body for the label, 44/58 Sora
 * light for the time, 24/36 Sora regular for the date) and the flat 64px
 * padding were already correct, but the card itself was still capped at
 * `max-w-[320px]` against Figma's actual fixed `width: 368px` (⇒ a 240px
 * inner content column once the 64px padding is subtracted on both sides —
 * exactly the `width="240"` on the label/date text nodes in Figma), and the
 * row gap was `gap-8` (32px) against Figma's real 48px (three 368px cards +
 * two 48px gaps = the row frame's own 1200px width). The narrower card is
 * what made the Armenian date line — always longer than Figma's English
 * placeholder — wrap harder than it should and read as a font/size
 * mismatch even though the type tokens themselves were untouched.
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

/** Degrees clockwise from 12 o'clock for each hand, reading `date`'s wall-clock
 * fields in `timeZone` — the same offset-free approach `utcOffsetMinutes`
 * uses, since a hand's angle only ever needs the local hour/minute/second,
 * never a real UTC diff. */
function handAngles(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = get('hour') % 12;
  const minute = get('minute');
  const second = get('second');
  return {
    hour: (hour + minute / 60) * 30,
    minute: (minute + second / 60) * 6,
    second: second * 6,
  };
}

/** One hand: a bar pivoting at the dial's centre, pointing `angle`° clockwise
 * from 12. Hour/minute use Figma's white→#acacac gradient with the 4px drop
 * shadow (nodes 440:3586/3589); the bar is anchored at its bottom edge, which
 * sits on the pivot, so `rotate` swings it about the centre. */
function ClockHand({
  angle,
  length,
  thickness,
  tail = 0,
}: {
  angle: number;
  length: number;
  thickness: number;
  /** Extra length behind the pivot. */
  tail?: number;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 rounded-[2px] bg-gradient-to-l from-white to-[#acacac] shadow-[4px_0px_4px_0px_rgba(0,0,0,0.25)]"
      style={{
        width: thickness,
        height: length + tail,
        marginLeft: -thickness / 2,
        marginTop: -length,
        transformOrigin: `50% ${length}px`,
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
}

const CLOCK = '/images/usa/clock';

/** A face layer, positioned in the dial's 240px box exactly as Figma's
 * 440:3575 group places it (offsets in px relative to the box). */
function Layer({
  src,
  box,
}: {
  src: string;
  box: { left: number; top: number; size?: number; width?: number; height?: number };
}) {
  const width = box.width ?? box.size!;
  const height = box.height ?? box.size!;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${CLOCK}/${src}`}
      alt=""
      width={width}
      height={height}
      className="pointer-events-none absolute max-w-none"
      style={{ left: box.left, top: box.top, width, height }}
    />
  );
}

/** The 240px dial above each card's digital time, built from Figma's own face
 * layers (shadow, brushed-dial texture, bezel rings, gold second hand, centre
 * cap) with live hour/minute/second hands and the twelve ticks drawn in CSS.
 * Renders a neutral 12:00 pose until `now` is available, the same
 * hydration-safe pattern the digital time below it uses. */
function AnalogClock({ now, timeZone }: { now: Date | null; timeZone: string }) {
  const angles = now ? handAngles(now, timeZone) : { hour: 0, minute: 0, second: 0 };

  return (
    <div aria-hidden="true" className="relative size-[240px] shrink-0">
      <Layer src="shadow.svg" box={{ left: -12.5, top: -8.5, width: 265, height: 265 }} />
      <Layer src="glow.svg" box={{ left: -36, top: -26, width: 350, height: 350 }} />
      <Layer src="dial.png" box={{ left: 31.16, top: 31.16, size: 177.683 }} />
      <ClockHand angle={angles.hour} length={58} thickness={7.3} />
      <ClockHand angle={angles.minute} length={84} thickness={3.7} />
      <Layer src="rim-a.svg" box={{ left: 1.23, top: 1.23, size: 237.547 }} />
      <Layer src="rim-b.svg" box={{ left: 28.68 - 2.0, top: 30.38 - 2.0, size: 179.236 + 4.0 }} />
      <Layer src="rim-c.svg" box={{ left: 32.08 - 0.5, top: 32.08 - 0.5, size: 175.835 + 1.0 }} />
      <Layer src="rim-d.svg" box={{ left: 1.23 - 5.5, top: 1.23 - 5.5, size: 237.547 + 11.0 }} />
      <Layer src="rim-e.svg" box={{ left: -4.5, top: -2.5, width: 247, height: 247 }} />
      <div
        className="absolute"
        style={{
          left: 117.4,
          top: 41.5,
          width: 5.196,
          height: 93.457,
          transformOrigin: '50% 78.5px',
          transform: `rotate(${angles.second}deg)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${CLOCK}/second.svg`} alt="" className="size-full max-w-none" />
      </div>
      <Layer src="cap.svg" box={{ left: 114.7 - 4.0, top: 114.7, width: 18.6, height: 18.6 }} />
      {Array.from({ length: 12 }).map((_, tick) => (
        <div
          key={tick}
          className="absolute rounded-[0.5px] bg-gradient-to-r from-white from-50% to-[#cdcdcd]"
          style={{
            left: 118.87,
            top: 3.73,
            width: 2.25,
            height: 9.084,
            transformOrigin: '50% 116.27px',
            transform: `rotate(${tick * 30}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function UsaStateClocks() {
  const t = useMessages().usa.stateClocks;
  const locale = useLocale();
  // Starts null so the server's markup and the client's first hydration
  // pass render identically (see `PromoCountdown`'s doc comment) — the real
  // times fill in a tick later.
  const [now, setNow] = useState<Date | null>(null);
  const [stateKey, setStateKey] = useState<string>(DEFAULT_STATE_KEY);

  useEffect(() => {
    queueMicrotask(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const state = STATE_OPTIONS.find((option) => option.key === stateKey) ?? STATE_OPTIONS[0]!;
  const hours = now ? hoursAhead(state.timeZone, 'Asia/Yerevan', now) : null;
  const diffCaption =
    hours === null
      ? undefined
      : interpolate(t.diff, { hours: hours > 0 ? `+${hours}` : `${hours}` });

  return (
    <div className="flex flex-col items-center gap-10 lg:gap-16">
      <h2 className="stretch-88 text-center text-[28px] font-light leading-[38px] text-ink sm:text-home-h2 sm:leading-[58px]">
        {t.heading}
      </h2>
      {/* One tool: Yerevan, and the US state the visitor picks. Offsets and the DST badge come
          from the time-zone database, so the gap shifts by itself when the US changes its clocks. */}
      <div className="grid w-full max-w-[784px] grid-cols-1 justify-items-center gap-6 md:grid-cols-2 lg:gap-12">
        <ClockCard
          label={t.cities.yerevan}
          timeZone="Asia/Yerevan"
          now={now}
          locale={locale}
          dst={now ? dstStatus('Asia/Yerevan', now) : null}
          dstLabels={t.dst}
        />
        <ClockCard
          selector={
            <StatePicker
              id="usa-state-select"
              label={t.stateLabel}
              value={stateKey}
              onChange={setStateKey}
              states={t.states}
            />
          }
          timeZone={state.timeZone}
          now={now}
          locale={locale}
          diffCaption={diffCaption}
          dst={now ? dstStatus(state.timeZone, now) : null}
          dstLabels={t.dst}
        />
      </div>
    </div>
  );
}

/** Figma's dial cards pair the city label with a small chevron affordance —
 * reproduced here rather than the browser's own native select arrow, which
 * doesn't match it. Shared by both non-Yerevan cards. */
function StatePicker({
  id,
  label,
  value,
  onChange,
  states,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  states: Record<string, string>;
}) {
  return (
    <div className="relative flex w-full items-center">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full appearance-none truncate border-none bg-transparent p-0 py-0 pl-6 pr-6 text-center text-[16px] leading-6 text-ink outline-none"
      >
        {STATE_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {states[option.key] ?? option.key}
          </option>
        ))}
      </select>
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
  );
}

function ClockCard({
  label,
  selector,
  timeZone,
  now,
  locale,
  diffCaption,
  dst,
  dstLabels,
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
  /** Whether daylight saving is in effect, off, or not observed here; null until the clock starts. */
  dst: DstStatus | null;
  dstLabels: Record<DstStatus, string>;
}) {
  return (
    <div className="flex w-full max-w-[368px] flex-col items-center gap-6 overflow-hidden rounded-[48px] bg-white px-6 py-8 text-center sm:py-12 lg:py-16">
      {selector ?? <p className="text-[16px] leading-6 text-ink">{label}</p>}
      <AnalogClock now={now} timeZone={timeZone} />
      <div className="flex flex-col gap-1">
        {now ? (
          <>
            <p className="font-display text-home-h2 font-light text-ink">
              {new Intl.DateTimeFormat(LOCALE_TAG[locale], {
                timeZone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }).format(now)}
            </p>
            <p className="font-display text-[24px] font-normal leading-9 text-ink">
              {formatLocalizedDate(now, timeZone, locale)}
            </p>
          </>
        ) : (
          <div aria-hidden="true" className="flex animate-pulse flex-col items-center gap-3">
            <div className="h-[58px] w-48 rounded-md bg-neutral-100" />
            <div className="h-9 w-56 rounded-md bg-neutral-100" />
          </div>
        )}
        {diffCaption && <p className="text-caption text-ink/50">{diffCaption}</p>}
        {dst && <p className="text-caption text-ink/50">{dstLabels[dst]}</p>}
      </div>
    </div>
  );
}
