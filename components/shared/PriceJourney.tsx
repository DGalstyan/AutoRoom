'use client';

import { useId, useRef, useState } from 'react';
import { Accordion, Button } from '@/components/ui';
import { useLeadWidget } from '@/components/lead/LeadWidgetProvider';
import { useCountUp, usePrefersReducedMotion, useScrollProgress } from '@/lib/motion';
import { formatUsd } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { PriceStop } from '@/types/car';

/**
 * "Գնի ճանապարհը" — price transparency as visual proof.
 *
 * Scrolling fills the route from the origin to Armenia; each stop's price chip
 * reveals in turn and a running counter sums them into the final cost. One
 * universal component — no per-car artwork.
 *
 * Two degradations, both required:
 *  - **Mobile**: the horizontal route becomes a vertical timeline, same chips.
 *  - **Reduced motion**: no scrubbing and no counting — the finished state
 *    (full line, all chips, final total) renders immediately.
 */

export interface PriceJourneyProps {
  stops: PriceStop[];
  /** Route start; only the label differs. */
  origin?: 'china' | 'usa';
  className?: string;
}

export function PriceJourney({ stops, origin = 'china', className }: PriceJourneyProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const reduced = usePrefersReducedMotion();
  const { openUniversal } = useLeadWidget();
  const headingId = useId();

  // Chips reveal across the first ~85% of the travel so the total has room to
  // land before the section leaves the viewport.
  const revealed = reduced
    ? stops.length
    : Math.min(stops.length, Math.floor((progress / 0.85) * stops.length + 0.0001));

  const total = stops.reduce((sum, stop) => sum + stop.amount, 0);
  const revealedTotal = stops.slice(0, revealed).reduce((sum, stop) => sum + stop.amount, 0);
  const counter = useCountUp(revealedTotal);
  const complete = revealed >= stops.length;

  const fill = reduced ? 100 : Math.min(100, (progress / 0.85) * 100);

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={cn('flex flex-col gap-8', className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-h2">
          {t('priceJourney.title')}
        </h2>
        <p className="flex items-baseline gap-2">
          <span className="text-small text-muted">{t('priceJourney.final')}</span>
          <span aria-live="polite" className="text-h3 font-bold tabular-nums">
            {formatUsd(counter)}
          </span>
        </p>
      </div>

      {/* Route. The rail is horizontal from `lg` and vertical below it; the same
          chips render in both, so there is one source of truth for the content. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className={cn(
            'absolute left-4 top-0 h-full w-px border-l-2 border-dashed border-line-light',
            'lg:left-0 lg:top-6 lg:h-px lg:w-full lg:border-l-0 lg:border-t-2',
          )}
        />
        <div
          aria-hidden="true"
          style={{ '--fill': `${fill}%` } as React.CSSProperties}
          className={cn(
            'absolute left-4 top-0 w-0.5 bg-accent transition-[height,width] duration-standard ease-expo',
            'h-[var(--fill)] lg:left-0 lg:top-6 lg:h-0.5 lg:w-[var(--fill)]',
          )}
        />

        <ol className="relative flex flex-col gap-6 pl-12 lg:flex-row lg:gap-4 lg:pl-0 lg:pt-0">
          <RouteEndpoint label={t(`priceJourney.route.${origin}`)} className="lg:hidden" />

          {stops.map((stop, index) => (
            <PriceChip
              key={stop.id}
              stop={stop}
              visible={index < revealed}
              reduced={reduced}
              index={index}
            />
          ))}
        </ol>

        <div className="mt-6 hidden items-center justify-between text-caption text-muted lg:flex">
          <span>{t(`priceJourney.route.${origin}`)}</span>
          <span>{t('priceJourney.route.transit')}</span>
          <span>{t('priceJourney.route.destination')}</span>
        </div>
      </div>

      {/* The end chip in Armenia — the number the whole section builds to. */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-accent bg-paper p-6',
          'transition-opacity duration-entrance ease-expo',
          complete ? 'opacity-100' : 'opacity-40',
        )}
      >
        <span className="text-lead font-semibold">{t('priceJourney.final')}</span>
        <span className="text-h2 font-bold tabular-nums text-accent">{formatUsd(total)}</span>
      </div>

      <Accordion
        items={[
          {
            id: 'breakdown',
            question: t('priceJourney.breakdownToggle'),
            answer: (
              <table className="w-full text-left text-small">
                <thead>
                  <tr className="text-caption uppercase text-muted">
                    <th scope="col" className="py-2">
                      {t('priceJourney.breakdown.item')}
                    </th>
                    <th scope="col" className="py-2 text-right">
                      {t('priceJourney.breakdown.amount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-light">
                  {stops.map((stop) => (
                    <tr key={stop.id}>
                      <td className="py-3 pr-4 text-ink">
                        {t(`priceJourney.stops.${stop.id}`)}
                        {stop.approximate ? (
                          <span className="ml-2 text-caption text-muted">
                            ({t('priceJourney.approximate')})
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 text-right font-semibold tabular-nums">
                        {formatUsd(stop.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 pr-4 font-bold">{t('priceJourney.final')}</td>
                    <td className="py-3 text-right font-bold tabular-nums">{formatUsd(total)}</td>
                  </tr>
                </tbody>
              </table>
            ),
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-small font-medium text-success">
          <span aria-hidden="true">✓</span>
          {t('priceJourney.noHiddenFees')}
        </p>
        <Button onClick={() => openUniversal({ sourceCta: t('common.cta.getExactCalculation') })}>
          {t('common.cta.getExactCalculation')}
        </Button>
      </div>
    </section>
  );
}

function RouteEndpoint({ label, className }: { label: string; className?: string }) {
  return (
    <li className={cn('-ml-12 flex items-center gap-3 text-caption text-muted', className)}>
      <span aria-hidden="true" className="h-2 w-2 rounded-pill bg-accent" />
      {label}
    </li>
  );
}

/**
 * One stop. The tooltip explains what the leg covers and is reachable by hover,
 * tap and keyboard — it is wired with `aria-describedby`, not `title`, so it is
 * readable on touch devices.
 */
function PriceChip({
  stop,
  visible,
  reduced,
  index,
}: {
  stop: PriceStop;
  visible: boolean;
  reduced: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <li
      className={cn(
        'relative flex-1 transition-all duration-entrance ease-expo',
        !reduced && !visible && 'translate-y-3 opacity-0',
        !reduced && visible && 'translate-y-0 opacity-100',
      )}
      style={reduced ? undefined : { transitionDelay: `${index * 60}ms` }}
    >
      <span
        aria-hidden="true"
        className="absolute -left-[2.1rem] top-5 h-3 w-3 rounded-pill border-2 border-paper bg-accent lg:-top-[1.65rem] lg:left-0"
      />
      <button
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-full rounded-md border border-line-light bg-paper p-4 text-left transition-colors duration-micro hover:border-ink"
      >
        <span className="block text-caption text-muted">
          {t(`priceJourney.stops.${stop.id}`)}
          {stop.approximate ? ` (${t('priceJourney.approximate')})` : null}
        </span>
        <span className="mt-1 block text-lead font-bold tabular-nums">
          {formatUsd(stop.amount)}
        </span>
      </button>

      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute z-20 mt-2 block w-full rounded-md bg-ink p-3 text-caption text-paper shadow-card"
        >
          {t(`priceJourney.tooltips.${stop.id}`)}
        </span>
      ) : null}
    </li>
  );
}
