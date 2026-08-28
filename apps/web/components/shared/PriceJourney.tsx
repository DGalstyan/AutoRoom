'use client';

import { useEffect, useRef, useState } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import type { UniversalPopupCarContext } from '@/components/shared/UniversalPopup';
import type { PriceChip } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';
import { messages } from '@/lib/messages';

const t = messages.china.detail.priceJourney;

/**
 * "Գնի ճանապարհը" — China (and later USA) car-detail S3.5. Horizontal route
 * Չինաստան → Հայաստան with each `car.priceJourney` chip revealing in
 * sequence once scrolled into view, ending in a summing counter for the
 * total. `references/components.md` describes this as scroll-driven with a
 * mobile vertical-timeline fallback; both are the same flex layout here,
 * just re-oriented by breakpoint, since the reveal logic (stagger + count-up)
 * doesn't depend on axis. Figma node 102:222.
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
    // Reduced motion: one frame at progress=1, landing on the final value
    // immediately rather than animating a count-up. Still routed through
    // rAF (not a synchronous setState in the effect body) so there is
    // exactly one state-update path to reason about.
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

  return (
    <div ref={ref} className="flex flex-col gap-14">
      <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-0">
        {chips.map((chip, index) => (
          <div key={chip.label} className="flex flex-1 items-center sm:flex-col">
            <div
              className={`flex-1 rounded-[20px] border border-dashed border-line-light bg-white p-5 transition-all duration-500 ease-out ${
                inView ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <p className="text-[14px] text-muted">{chip.label}</p>
              <p className="mt-1 font-display text-[20px] font-semibold text-ink">
                {formatUsd(chip.amount)}
              </p>
              {chip.note && <p className="mt-1 text-[12px] text-muted">{chip.note}</p>}
            </div>
            {index < chips.length - 1 && (
              <div
                className="hidden h-px flex-1 shrink-0 border-t border-dashed border-line-light sm:block"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      <div
        className={`flex flex-col items-center gap-1 rounded-[20px] bg-ink px-8 py-6 text-center transition-opacity duration-500 ${
          inView ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-[16px] text-white/70">{t.finalLabel}</span>
        <span className="font-display text-[32px] font-bold text-white">
          {formatUsd(displayedTotal)}
        </span>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'china-detail-price-journey', car })}
          className="inline-flex items-center gap-1 rounded-pill bg-accent px-6 py-4 text-[14px] font-bold text-ink transition-colors duration-standard hover:bg-accent-600"
        >
          {t.cta}
        </button>
      </div>
    </div>
  );
}
