'use client';

import { useEffect, useRef, useState } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import type { UniversalPopupCarContext } from '@/components/shared/UniversalPopup';
import type { PriceChip } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * "Գնի ճանապարհը" — China (and later USA) car-detail S3.5. A left-aligned
 * heading over a two-column layout: a vertical stack of numbered white-card
 * steps (each `car.priceJourney` chip) ending in a formula-style total row,
 * next to a decorative China→Armenia route panel. Figma node 102:221/102:222.
 *
 * The route panel (node 102:255 "Map-area") is a static stock map image with
 * hand-placed pin vectors — pure decoration with no real data behind it, so
 * it's approximated here as a stylised gradient + route dots rather than
 * reproduced pixel-for-pixel; nothing on this page depends on it.
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
  const t = useMessages().china.detail.priceJourney;
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
          className="relative min-h-[300px] flex-1 overflow-hidden rounded-xl border-[5px] border-white bg-gradient-to-br from-info/20 via-surface-light to-success/10 lg:flex-[589]"
          aria-hidden="true"
        >
          <RoutePins />
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

/** A stylised route line + three stops standing in for the Figma mock's stock map image. */
function RoutePins() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
    >
      <path
        d="M40 240 C 140 260, 160 120, 260 100 S 360 40, 370 30"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      {[
        [40, 240],
        [230, 110],
        [370, 30],
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
    </svg>
  );
}
