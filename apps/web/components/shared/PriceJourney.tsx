'use client';

import { useEffect, useRef, useState } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import type { UniversalPopupCarContext } from '@/components/shared/UniversalPopup';
import type { PriceChip } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';
import { useMessages } from '@/components/shared/LocaleProvider';

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
 */
export function PriceJourney({
  chips,
  finalAmount,
  car,
}: {
  chips: PriceChip[];
  finalAmount: number;
  car: UniversalPopupCarContext;
}) {
  const t = useMessages().common.carDetail.priceJourney;
  const { openUniversal } = useLeadWidgets();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [displayedTotal, setDisplayedTotal] = useState(0);

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
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const durationMs = reduceMotion ? 0 : 900;
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = durationMs === 0 ? 1 : Math.min(1, (now - start) / durationMs);
      setDisplayedTotal(Math.round(finalAmount * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, finalAmount]);

  if (chips.length === 0) return null;

  const formula = `${chips.map((chip) => formatUsd(chip.amount)).join(' + ')} = ${formatUsd(displayedTotal)}`;

  return (
    <div ref={ref} className="flex flex-col gap-16">
      <h2 className="font-display text-home-h2 font-light text-neutral-900">{t.heading}</h2>

      <div className="flex flex-col gap-12 lg:flex-row lg:items-stretch">
        <div className="flex flex-col justify-between gap-3 lg:flex-[715]">
          <div className="flex flex-col gap-3">
            {chips.map((chip, index) => (
              <div
                key={chip.label}
                className={`flex items-center gap-3 rounded-[20px] bg-white px-4 py-6 transition-all duration-500 ease-out ${
                  index === 0 ? 'shadow-card' : ''
                } ${inView ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-25 text-[16px] font-bold text-neutral-900">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-[16px] font-medium text-neutral-900">{chip.label}</p>
                  <p className="text-[16px] font-bold text-neutral-800">{formatUsd(chip.amount)}</p>
                  {chip.note && <p className="text-[12px] text-neutral-700">{chip.note}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[20px] bg-white px-4 py-6">
            <p className="text-[16px] text-neutral-900">{t.finalLabel}</p>
            <p className="mt-3 text-[20px] font-bold text-neutral-800">{formula}</p>
          </div>
        </div>

        <div
          className="relative min-h-[300px] flex-1 overflow-hidden rounded-xl border-[5px] border-white bg-neutral-25 lg:flex-[589]"
          aria-hidden="true"
        >
          <RouteMap />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'china-detail-price-journey', car })}
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-4 text-[20px] text-neutral-800 transition-colors duration-standard hover:bg-accent-600"
        >
          {t.cta}
          <span className="flex size-6 rotate-45 items-center justify-center" aria-hidden="true">
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

/**
 * A hand-built stand-in for Figma's stock map screenshot: a light city-block
 * grid + a water shape in one corner (`components/shared/ArmeniaMap.tsx`
 * sets the precedent for this "convincing but hand-drawn, not a real map
 * image/API" treatment elsewhere on the site), with a solid route line
 * running from a car-glyph origin pin to two plain stop dots.
 */
function RouteMap() {
  const blocks = [
    [24, 30, 46, 28],
    [92, 24, 34, 40],
    [18, 96, 38, 34],
    [78, 150, 50, 30],
    [150, 60, 40, 46],
    [210, 30, 44, 34],
    [270, 70, 38, 50],
    [40, 200, 44, 30],
    [130, 210, 50, 26],
    [230, 160, 40, 40],
    [290, 150, 34, 44],
    [260, 220, 46, 28],
  ];
  const roadsV = [70, 140, 200, 260, 320];
  const roadsH = [20, 80, 140, 200, 260];

  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
    >
      <rect width="400" height="300" fill="#FAFAFA" />
      {blocks.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="3" fill="#E5E7E8" />
      ))}
      {roadsV.map((x) => (
        <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="300" stroke="#FFFFFF" strokeWidth="6" />
      ))}
      {roadsH.map((y) => (
        <line key={`h-${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#FFFFFF" strokeWidth="6" />
      ))}
      {/* River, tucked into the bottom-right corner like Figma's own map. */}
      <path d="M400 210 C 330 220, 300 250, 320 300 L 400 300 Z" fill="#BFE9FF" fillOpacity="0.6" />

      <path
        d="M60 60 C 140 70, 150 150, 220 160 S 320 230, 340 250"
        fill="none"
        stroke="#B23A48"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {[
        [220, 160],
        [340, 250],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="7"
          fill="white"
          stroke="#B23A48"
          strokeWidth="3"
        />
      ))}

      {/* Origin pin — a car glyph in a gold teardrop, matching the site's accent color. */}
      <g transform="translate(60 60)">
        <path
          d="M0 -22c11 0 20 9 20 20 0 14-20 34-20 34S-20 12-20-2c0-11 9-20 20-20Z"
          fill="#C8A24A"
        />
        <g transform="translate(-9 -11)" stroke="white" strokeWidth="1.6" fill="none">
          <path
            d="M1 12l1.5-4.5A2 2 0 0 1 4.4 6h11.2a2 2 0 0 1 1.9 1.5L19 12v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H5v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-4Z"
            strokeLinejoin="round"
          />
          <circle cx="5" cy="15.5" r="1.2" fill="white" stroke="none" />
          <circle cx="15" cy="15.5" r="1.2" fill="white" stroke="none" />
        </g>
      </g>
    </svg>
  );
}
