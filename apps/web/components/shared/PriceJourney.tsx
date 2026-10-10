'use client';

import { useEffect, useRef, useState } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import type { UniversalPopupCarContext } from '@/components/shared/UniversalPopup';
import type { PriceChip } from '@/lib/types/car';
import { formatUsd, localizeText } from '@/lib/types/car';
import { Price } from '@/components/ui/Price';
import { TotalBar } from '@/components/ui/TotalBar';
import { buildAddends, countUpValue, resolveJourney } from '@/lib/priceJourney';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';

/**
 * "Գնի ճանապարհը" — China car-detail S3.5 only (per `references/pages.md`
 * the USA pages have no price-journey breakdown, so `car.priceJourney` is
 * simply empty for USA cars and callers already guard on `.length > 0`). A
 * left-aligned heading over a two-column layout: a vertical stack of
 * numbered white-card steps (each `car.priceJourney` chip) ending in a
 * formula-style total row, next to a decorative China→Armenia route panel.
 * Figma node 102:221/102:222. Message strings live under the shared
 * `common.carDetail` namespace alongside the rest of this page's copy
 * (nothing China-specific in the wording itself), even though the component
 * is only ever mounted on the China page.
 *
 * The route panel (node 102:255 "Map-area") is a static stock map image with
 * hand-placed pin vectors — pure decoration with no real data behind it, so
 * it's a hand-built stand-in (city-block grid, a water shape, a solid route
 * line from an origin pin with a car glyph to two stop dots) rather than an
 * actual map image/API, but visually matching Figma's own look a lot more
 * closely than the earlier gradient-only version did; nothing on this page
 * depends on it being a real, navigable map.
 *
 * Rows still reveal on scroll with a summing counter into the final total —
 * `components.md`'s documented interaction for this component, which this
 * frame's static screenshot can't show either way but doesn't contradict.
 *
 * Each chip's `label`/`note` is per-locale (admin enters hy/ru/en in the
 * `PriceJourneyEditor`); `localizeText` picks the visitor's own locale and
 * falls back to Armenian, the same `text[locale] ?? text.hy` rule
 * `lib/faq.ts`'s `getFaq` already uses for FAQ questions and answers.
 */
export function PriceJourney({
  chips,
  car,
}: {
  chips: PriceChip[];
  car: UniversalPopupCarContext;
}) {
  const t = useMessages().common.carDetail.priceJourney;
  const locale = useLocale();
  const { openUniversal } = useLeadWidgets();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // The total is always the sum of the chips listed above it — never a
  // separately-stored figure that can drift from them. It starts at the real
  // sum (so SSR, no-JS, reduced-motion and a never-firing observer all show
  // the right number, not "0 $") and only dips to 0 to count up once the
  // section actually scrolls into view.
  const { total } = resolveJourney(chips);
  // `null` = not animating → show the real sum.
  const [animatedTotal, setAnimatedTotal] = useState<number | null>(null);
  const displayedTotal = animatedTotal ?? total;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const durationMs = 900;
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      setAnimatedTotal(progress < 1 ? countUpValue(total, progress) : null);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    // requestAnimationFrame is paused in a background tab, which would strand the
    // total partway (or at 0 $) — this timer always lands on the real figure.
    const settle = window.setTimeout(() => setAnimatedTotal(null), durationMs + 150);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [inView, total]);

  if (chips.length === 0) return null;

  const addends = buildAddends(chips);

  return (
    <div ref={ref} className="flex flex-col gap-8 lg:gap-16">
      <h2 className="type-h2 text-neutral-900">{t.heading}</h2>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-12">
        <div className="flex flex-col justify-between gap-3 lg:flex-[715] lg:gap-[45px]">
          <div className="flex flex-col gap-3">
            {chips.map((chip, index) => {
              const note = localizeText(chip.note, locale);
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-[20px] bg-white px-4 py-6 transition-all duration-500 ease-out ${
                    index === 0 ? 'shadow-[0_4px_22px_rgba(0,0,0,0.1)]' : ''
                  } ${inView ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
                  style={{ transitionDelay: `${index * 120}ms` }}
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-25 text-[16px] leading-6 ${
                      index === 0 ? 'font-bold text-neutral-900' : 'font-medium text-neutral-800'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p
                      className={`stretch-90 font-medium text-neutral-900 ${
                        index === 0 ? 'text-[16px] leading-6' : 'text-[14px] leading-5'
                      }`}
                    >
                      {localizeText(chip.label, locale)}
                    </p>
                    {note && <p className="text-[12px] leading-4 text-neutral-700">{note}</p>}
                  </div>
                  <Price as="p" className="shrink-0 text-neutral-800">
                    {formatUsd(chip.amount)}
                  </Price>
                </div>
              );
            })}
          </div>

          <TotalBar tone="light" label={t.finalLabel} value={formatUsd(displayedTotal)}>
            {addends}
          </TotalBar>
        </div>

        <PriceMap />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'china-detail-price-journey', car })}
          className="inline-flex min-h-[82px] items-center gap-2 rounded-pill bg-accent px-6 text-[20px] leading-7 text-neutral-800 transition-colors duration-standard hover:bg-accent-600"
        >
          {t.cta}
          <span className="flex size-6 items-center justify-center" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 12 12 4M12 4H5M12 4v7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}

const MAP = '/images/china/map';
/** The map's padding box (581×565 less the 5.038px border), the box Figma positions its layers in. */
const MAP_W = 570.924;
const MAP_H = 554.924;
const at = (x: number, y: number, w: number, h: number) => ({
  left: `${(x / MAP_W) * 100}%`,
  top: `${(y / MAP_H) * 100}%`,
  width: `${(w / MAP_W) * 100}%`,
  height: `${(h / MAP_H) * 100}%`,
});

/**
 * The route panel — Figma `Map-area` 442:9185, 581×565, 5px white border, 32px
 * corners. The design's own layers at the design's coordinates (as percentages,
 * so it scales on phones): the soft city map with a 50% white wash baked in, the
 * pink route in segments, the origin pin with the car, and the stop markers.
 * Decorative only, so hidden from assistive tech.
 */
function PriceMap() {
  const layer = 'absolute max-w-none';
  const layers: [string, ReturnType<typeof at>][] = [
    ['route-1.svg', at(73.2, 82.5, 192, 183)],
    ['route-0.svg', at(73.09, 87.69, 190.197, 0.63)],
    ['route-2.svg', at(219.9, 253.2, 112.9, 177.4)],
    ['route-3.svg', at(305, 427.6, 74.7, 96.1)],
    ['pin.svg', at(39.96, 31.96, 77, 89)],
    ['stop-1.svg', at(249.43, 245.77, 25.821, 25.821)],
    ['stop-2a.svg', at(290.96, 341.96, 25.821, 25.821)],
    ['stop-2b.svg', at(296, 347, 16.375, 16.375)],
    ['stop-3.svg', at(358.39, 501.47, 25.821, 25.821)],
    ['stop-0.svg', at(61.13, 78.88, 25.821, 25.821)],
  ];
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[581/565] w-full overflow-hidden rounded-[32px] border-[5px] border-white bg-neutral-25 lg:flex-[581] lg:self-start"
    >
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src={`${MAP}/base.webp`}
        alt=""
        className={layer}
        style={at(-5.04, -271.04, 592.634, 1053.572)}
      />
      {layers.map(([file, style]) => (
        <img key={file} src={`${MAP}/${file}`} alt="" className={layer} style={style} />
      ))}
      <img
        src={`${MAP}/car.webp`}
        alt=""
        className={`${layer} object-cover`}
        style={at(35.96, 66.96, 75, 50)}
      />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
