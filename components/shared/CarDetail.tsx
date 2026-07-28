'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Chip,
  ChipGroup,
  Countdown,
  TabPanel,
  Tabs,
  useTabsId,
} from '@/components/ui';
import { CarImage } from '@/components/shared/CarImage';
import { BuyWithLoan } from '@/components/shared/BuyWithLoan';
import { LoanCalculator } from '@/components/shared/LoanCalculator';
import { PriceJourney } from '@/components/shared/PriceJourney';
import { SimilarOffers } from '@/components/shared/SimilarOffers';
import { useCompare } from '@/components/compare/CompareProvider';
import { useLeadWidget } from '@/components/lead/LeadWidgetProvider';
import { COLOR_OPTIONS, toLeadCarContext } from '@/lib/lead';
import { formatUsd } from '@/lib/format';
import { t, tf, type MessageKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { SPEC_ROWS, carName, type Car, type CarColorId } from '@/types/car';

/**
 * One car-detail component for all four variants. `car.variant` decides the
 * right column and the CTAs; everything else (hero, image tabs, spec table,
 * similar offers) is shared.
 *
 * Variant rules, straight from the spec:
 *  - **china** — colour picker (order-only), `PriceJourney`, `BuyWithLoan` +
 *    `LoanCalculator`, and the two per-car CTAs.
 *  - **usa-auction** — VIN/lot, damage, location, estimated final price, and the
 *    platform CTA logic: Copart/IAAI link out to the lot, Manheim never does.
 *  - **usa-available** — same financing blocks as China.
 *  - **machinery** — technical specs and the leasing note; no calculator.
 */

const LOAN_CALCULATOR_ID = 'loan-calculator';

export interface CarDetailProps {
  car: Car;
  similar?: Car[];
}

export function CarDetail({ car, similar = [] }: CarDetailProps) {
  const { openUniversal } = useLeadWidget();
  const compare = useCompare();
  const name = carName(car);
  const tabsId = useTabsId();

  const galleries = useMemo(() => buildGalleries(car), [car]);
  const [tab, setTab] = useState(galleries[0]?.id ?? 'exterior');
  const [color, setColor] = useState<CarColorId | undefined>(car.colors?.[0]);

  const showFinancing = car.variant === 'china' || car.variant === 'usa-available';
  const isManheim = car.auction?.platform === 'manheim';
  const auctionUrl = !isManheim ? car.auction?.url : undefined;

  function openCarPopup(sourceCta: string) {
    openUniversal({
      sourceCta,
      car: toLeadCarContext(car),
      colorOptions: car.condition === 'on-order' ? car.colors : undefined,
      preselect: {
        interest:
          car.variant === 'machinery'
            ? 'machinery'
            : car.variant.startsWith('usa')
              ? 'usa'
              : 'china',
      },
    });
  }

  return (
    <div className="container-page section-y flex flex-col gap-16">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Left: gallery, colours, specs. */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  car.condition === 'in-stock'
                    ? 'available'
                    : car.condition === 'auction'
                      ? 'auction'
                      : 'on-order'
                }
              >
                {t(conditionLabel(car))}
              </Badge>
              {car.auction ? <Badge tone="auction">{car.auction.lot}</Badge> : null}
            </div>

            <h1 className="text-h1">
              {name} <span className="text-muted">{car.year}</span>
            </h1>

            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <span className="text-h2 font-bold">{formatUsd(car.price)}</span>
              {car.estimatedFinalPrice && car.estimatedFinalPrice !== car.price ? (
                <span className="text-small text-muted">
                  {t('car.estimatedFinalPrice')}: {formatUsd(car.estimatedFinalPrice)}
                </span>
              ) : null}
            </div>

            {car.onRoad ? (
              <div className="flex flex-col gap-1">
                <span className="text-caption text-muted">{t('car.deliveryEta')}</span>
                <Countdown target={car.onRoad.etaDate} variant="compact" />
              </div>
            ) : null}
          </header>

          {galleries.length > 0 ? (
            <div className="flex flex-col gap-4">
              <Tabs
                items={galleries.map((gallery) => ({ id: gallery.id, label: t(gallery.labelKey) }))}
                value={tab}
                onChange={setTab}
                label={t('car.specsTitle')}
                baseId={tabsId}
              />
              {galleries.map((gallery) => (
                <TabPanel
                  key={gallery.id}
                  id={gallery.id}
                  baseId={tabsId}
                  active={gallery.id === tab}
                >
                  {gallery.video ? (
                    <video
                      src={gallery.video}
                      controls
                      playsInline
                      className="aspect-[16/9] w-full rounded-lg bg-surface-light object-cover"
                    />
                  ) : (
                    <div className="aspect-[16/9] overflow-hidden rounded-lg bg-surface-light">
                      <CarImage
                        src={
                          // Colour selection only re-skins the exterior shots.
                          gallery.id === 'exterior' && color && car.colorImages?.[color]
                            ? car.colorImages[color]
                            : (gallery.images?.[0] ?? car.images.exterior[0])
                        }
                        alt={name}
                        priority
                      />
                    </div>
                  )}
                </TabPanel>
              ))}
            </div>
          ) : null}

          {/* Colour picker — order-only cars, per the spec. */}
          {car.condition === 'on-order' && car.colors?.length ? (
            <ChipGroup label={t('common.form.preferredColor')}>
              {COLOR_OPTIONS.filter((option) => car.colors?.includes(option.value)).map(
                (option) => (
                  <Chip
                    key={option.value}
                    selected={color === option.value}
                    onClick={() => setColor(option.value)}
                  >
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: option.hex }}
                      className="h-4 w-4 rounded-pill border border-line-light"
                    />
                    {t(option.labelKey)}
                  </Chip>
                ),
              )}
            </ChipGroup>
          ) : null}

          <section className="flex flex-col gap-4">
            <h2 className="text-h3">{t('car.specsTitle')}</h2>
            <dl className="divide-y divide-line-light border-y border-line-light">
              {SPEC_ROWS[car.variant].map((row) => {
                const value = car.specs[row.field];
                if (value === undefined || value === '') return null;
                return (
                  <div key={row.field} className="flex justify-between gap-6 py-3">
                    <dt className="text-small text-muted">{t(row.labelKey)}</dt>
                    <dd className="text-right text-small font-medium">{String(value)}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>

        {/* Right: the CTAs and financing, sticky on desktop. */}
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-lg border border-line-light bg-paper p-6 shadow-card lg:sticky lg:top-[calc(var(--header-height)+24px)]">
            {car.variant === 'usa-auction' ? (
              <>
                {car.auction ? (
                  <div className="flex flex-col gap-1 pb-2">
                    <span className="text-caption text-muted">{t('car.auction.endsIn')}</span>
                    <Countdown target={car.auction.endsAt} variant="compact" />
                  </div>
                ) : null}
                {auctionUrl ? (
                  <Button href={auctionUrl} external variant="outline" fullWidth>
                    {t('common.cta.viewCarOnline')}
                  </Button>
                ) : null}
                <Button fullWidth onClick={() => openCarPopup(t('common.cta.contactUs'))}>
                  {t('common.cta.contactUs')}
                </Button>
                {auctionUrl ? (
                  // TODO(P4.2): the full View-Only guest-login explainer (5 steps)
                  // lands with the USA page; this is the entry point it hangs off.
                  <p className="text-caption text-muted">{t('car.followAuctionOnline')}</p>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  fullWidth
                  onClick={() => openCarPopup(tf('car.personalOffer', { car: name }))}
                >
                  {tf('car.personalOffer', { car: name })}
                </Button>
                {showFinancing ? (
                  <Button href={`#${LOAN_CALCULATOR_ID}`} variant="outline" fullWidth>
                    {t('car.seeLoanTermsForThisCar')}
                  </Button>
                ) : null}
              </>
            )}

            <button
              type="button"
              onClick={() => compare.toggle(car.slug)}
              aria-pressed={compare.isSelected(car.slug)}
              className={cn(
                'mt-1 rounded-pill border px-4 py-2 text-small font-medium transition-colors duration-micro',
                compare.isSelected(car.slug)
                  ? 'border-accent bg-accent text-paper'
                  : 'border-line-light text-ink hover:border-ink',
              )}
            >
              ⚖ {compare.isSelected(car.slug) ? t('compare.remove') : t('car.compareThisCar')}
            </button>
          </div>

          {showFinancing ? (
            <>
              <BuyWithLoan />
              <LoanCalculator
                id={LOAN_CALCULATOR_ID}
                priceUsd={car.estimatedFinalPrice ?? car.price}
              />
            </>
          ) : null}

          {car.variant === 'machinery' ? (
            <p className="rounded-lg border border-line-light bg-surface-light p-6 text-small text-muted">
              {t('machinery.financingNote')}
            </p>
          ) : null}
        </aside>
      </div>

      {car.variant === 'china' && car.priceJourney?.length ? (
        <PriceJourney stops={car.priceJourney} origin="china" />
      ) : null}

      <SimilarOffers cars={similar} />
    </div>
  );
}

function conditionLabel(car: Car): MessageKey {
  switch (car.condition) {
    case 'in-stock':
      return car.variant === 'usa-available'
        ? 'common.status.availableInArmenia'
        : 'common.status.available';
    case 'on-order':
      return 'common.status.onOrder';
    case 'on-road':
      return 'common.status.onRoad';
    case 'auction':
      return 'common.status.auction';
  }
}

interface Gallery {
  id: string;
  labelKey: MessageKey;
  images?: string[];
  video?: string;
}

/** Only tabs that actually have media — an empty "Ներքին" tab is worse than none. */
function buildGalleries(car: Car): Gallery[] {
  const galleries: Gallery[] = [
    { id: 'exterior', labelKey: 'car.tabs.exterior', images: car.images.exterior },
    {
      id: 'interior',
      // Machinery has a cabin, not an interior.
      labelKey: car.variant === 'machinery' ? 'car.tabs.cabin' : 'car.tabs.interior',
      images: car.images.interior,
    },
    { id: 'details', labelKey: 'car.tabs.details', images: car.images.details },
    { id: 'video', labelKey: 'car.tabs.video', video: car.images.video },
  ];

  return galleries.filter((gallery) => gallery.video || (gallery.images?.length ?? 0) > 0);
}
