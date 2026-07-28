'use client';

import Link from 'next/link';
import { Badge, Button, Countdown } from '@/components/ui';
import { CarImage } from '@/components/shared/CarImage';
import { useCompare } from '@/components/compare/CompareProvider';
import { useLeadWidget } from '@/components/lead/LeadWidgetProvider';
import { formatUsd } from '@/lib/format';
import { toLeadCarContext } from '@/lib/lead';
import { t, type MessageKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { carHref, carName, type Car, type CarCondition } from '@/types/car';
import type { BadgeTone } from '@/components/ui';

/**
 * One card, every context. The spec asks for different amounts of information
 * depending on where the card appears, so `context` — not four components —
 * decides what is shown:
 *
 *  - `featured` / `compact`: model name + total price only (Homepage, quiz results).
 *  - `list`: full detail incl. condition and financing availability (China list).
 *  - `offer`: struck old price + new price + deadline countdown.
 *  - `auction`: damage, mileage, current bid, estimated final price, end countdown.
 *  - `on-road`: arrival countdown + transit status + "reserve before it lands".
 *
 * The CTA logic is the part that is easy to get wrong: Copart/IAAI cards link
 * out to the lot **and** offer the popup, Manheim cards only offer the popup
 * (no direct auction access), and everything else links to our own detail page.
 */

export type CarCardContext = 'featured' | 'compact' | 'list' | 'offer' | 'auction' | 'on-road';

const CONDITION_BADGE: Record<CarCondition, { tone: BadgeTone; labelKey: MessageKey }> = {
  'in-stock': { tone: 'available', labelKey: 'common.status.available' },
  'on-order': { tone: 'on-order', labelKey: 'common.status.onOrder' },
  'on-road': { tone: 'on-road', labelKey: 'common.status.onRoad' },
  auction: { tone: 'auction', labelKey: 'common.status.auction' },
};

const PLATFORM_LABEL = { copart: 'Copart', iaai: 'IAAI', manheim: 'Manheim' } as const;

interface CarCardProps {
  car: Car;
  context?: CarCardContext;
  /** Shows the "⚖ Համեմատել" toggle (China + USA lists). */
  showCompare?: boolean;
  priority?: boolean;
  className?: string;
}

export function CarCard({
  car,
  context = 'list',
  showCompare = false,
  priority = false,
  className,
}: CarCardProps) {
  const { openUniversal } = useLeadWidget();
  const href = carHref(car);
  const name = carName(car);
  const minimal = context === 'featured' || context === 'compact';
  const condition = CONDITION_BADGE[car.condition];

  const isManheim = car.auction?.platform === 'manheim';
  const auctionUrl = !isManheim ? car.auction?.url : undefined;

  function openCarPopup(sourceCta: string) {
    openUniversal({
      sourceCta,
      car: toLeadCarContext(car),
      colorOptions: car.condition === 'on-order' ? car.colors : undefined,
      preselect: { interest: car.variant.startsWith('usa') ? 'usa' : 'china' },
    });
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-line-light bg-paper',
        'shadow-card transition-all duration-standard ease-expo hover:-translate-y-1 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-light">
        {/* The whole card is clickable through the title link's overlay below,
            so the image itself is not a second link to the same destination. */}
        <CarImage
          src={car.images.exterior[0]}
          alt={name}
          priority={priority}
          className="transition-transform duration-entrance ease-expo group-hover:scale-105"
        />

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          {!minimal ? <Badge tone={condition.tone}>{t(condition.labelKey)}</Badge> : null}
          {car.auction ? (
            <Badge tone="auction">{PLATFORM_LABEL[car.auction.platform]}</Badge>
          ) : null}
          {car.onRoad ? <Badge tone="on-road">{t(`car.onRoad.${car.onRoad.status}`)}</Badge> : null}
          {car.badges?.map((badgeKey) => (
            <Badge key={badgeKey} tone="info">
              {t(badgeKey)}
            </Badge>
          ))}
        </div>

        {showCompare ? <CompareToggle car={car} /> : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lead font-semibold">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {name}
          </Link>
        </h3>

        {!minimal ? (
          <p className="text-small text-muted">
            {[
              car.year,
              car.powertrain ? t(`car.powertrain.${car.powertrain}`) : null,
              car.specs.range,
              car.specs.mileage,
              car.specs.trim,
            ]
              .filter(Boolean)
              .join(' • ')}
          </p>
        ) : null}

        {context === 'auction' && car.specs.damage ? (
          <p className="text-small text-muted">
            {t('car.spec.damage')}: {car.specs.damage}
          </p>
        ) : null}

        <PriceBlock car={car} context={context} />

        {context === 'auction' && car.auction ? (
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted">{t('car.auction.endsIn')}</span>
            <Countdown target={car.auction.endsAt} variant="compact" />
          </div>
        ) : null}

        {context === 'on-road' && car.onRoad ? (
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted">{t('car.deliveryEta')}</span>
            <Countdown target={car.onRoad.etaDate} variant="compact" />
          </div>
        ) : null}

        {context === 'list' && typeof car.financingAvailable === 'boolean' ? (
          <p
            className={cn(
              'text-caption font-medium',
              car.financingAvailable ? 'text-success' : 'text-muted',
            )}
          >
            {car.financingAvailable ? t('car.financingAvailable') : t('car.financingUnavailable')}
          </p>
        ) : null}

        {/* CTAs sit above the card-wide link overlay so they stay clickable. */}
        <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-2">
          {car.variant === 'usa-auction' ? (
            <>
              {auctionUrl ? (
                <Button href={auctionUrl} external size="sm" variant="outline">
                  {t('common.cta.viewCarOnline')}
                </Button>
              ) : null}
              <Button size="sm" onClick={() => openCarPopup(t('common.cta.contactUs'))}>
                {t('common.cta.contactUs')}
              </Button>
            </>
          ) : car.condition === 'on-road' ? (
            <>
              <Button size="sm" onClick={() => openCarPopup(t('common.cta.reserveBeforeArrival'))}>
                {t('common.cta.reserveBeforeArrival')}
              </Button>
              <Button href={href} size="sm" variant="ghost">
                {t('common.cta.viewDetails')}
              </Button>
            </>
          ) : (
            <Button href={href} size="sm" variant={minimal ? 'ghost' : 'outline'}>
              {car.variant === 'usa-available'
                ? t('common.cta.viewCar')
                : t('common.cta.viewDetails')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function PriceBlock({ car, context }: { car: Car; context: CarCardContext }) {
  if (context === 'offer' && car.offer) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-small text-muted line-through">
            {formatUsd(car.offer.oldPrice)}
          </span>
          <span className="text-h3 font-bold text-accent">{formatUsd(car.price)}</span>
        </div>
        <span className="text-caption text-muted">{t('offers.deadline')}</span>
        <Countdown target={car.offer.endsAt} variant="compact" />
      </div>
    );
  }

  if (context === 'auction' && car.auction) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-caption text-muted">{t('car.auction.currentBid')}</span>
        <span className="text-h3 font-bold">{formatUsd(car.auction.currentBid ?? car.price)}</span>
        {car.estimatedFinalPrice ? (
          <span className="text-small text-muted">
            {t('car.estimatedFinalPrice')}: {formatUsd(car.estimatedFinalPrice)}
          </span>
        ) : null}
      </div>
    );
  }

  // Featured/compact cards are name + total price only, per the spec.
  const minimal = context === 'featured' || context === 'compact';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-h3 font-bold">{formatUsd(car.price)}</span>
      {!minimal && car.estimatedFinalPrice && car.estimatedFinalPrice !== car.price ? (
        <span className="text-small text-muted">
          {t('car.estimatedFinalPrice')}: {formatUsd(car.estimatedFinalPrice)}
        </span>
      ) : null}
    </div>
  );
}

/** "⚖ Համեմատել" — adds the car to `CompareTool` (max 3). */
function CompareToggle({ car }: { car: Car }) {
  const { isSelected, toggle, canAdd } = useCompare();
  const selected = isSelected(car.slug);
  const disabled = !selected && !canAdd;

  return (
    <button
      type="button"
      onClick={() => toggle(car.slug)}
      disabled={disabled}
      aria-pressed={selected}
      title={disabled ? t('compare.limit') : undefined}
      className={cn(
        'absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5',
        'text-caption font-semibold transition-colors duration-micro',
        selected
          ? 'border-accent bg-accent text-paper'
          : 'border-line-light bg-paper/90 text-ink backdrop-blur hover:border-ink',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span aria-hidden="true">⚖</span>
      {selected ? t('compare.remove') : t('common.cta.compare')}
    </button>
  );
}
