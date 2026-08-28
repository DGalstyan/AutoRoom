'use client';

import { useState } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { CarGallery } from '@/components/shared/CarGallery';
import { CarSpecs } from '@/components/shared/CarSpecs';
import { BuyWithLoan } from '@/components/shared/BuyWithLoan';
import type { Car } from '@/lib/types/car';
import { carHref, formatUsd } from '@/lib/types/car';
import type { Bank } from '@/lib/banks';
import { interpolate, messages } from '@/lib/messages';

const t = messages.china.detail;
const conditionLabels = messages.china.carCard.conditions;

/**
 * China (and later USA) car-detail S3.1–3.3 + 3.6b: name/price hero with the
 * two sticky-style CTAs, the image gallery, the order-only colour picker
 * (only `ON_ORDER` cars carry meaningful `car.colors` — an in-stock car is
 * one specific physical car in one specific colour, per
 * `apps/api/prisma/schema.prisma`'s `colors` comment) and the compact
 * `BuyWithLoan` bank grid. One client component because the colour picker,
 * gallery and both CTAs all share the same `selectedColor` state. Figma node
 * 102:476.
 */
export function CarDetailHero({ car, banks }: { car: Car; banks: Bank[] }) {
  const { openUniversal } = useLeadWidgets();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();

  const colors = car.condition === 'ON_ORDER' ? car.colors : [];
  const selectedColorImage = colors.find((c) => c.name === selectedColor)?.imageUrl ?? null;

  const carContext = {
    name: `${car.make} ${car.model}`,
    price: formatUsd(car.price),
    image: car.images[0]?.url ?? undefined,
    url: carHref(car),
    colors: colors.map((c) => c.name),
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[40px] font-light leading-[48px] text-ink sm:text-[56px] sm:leading-[64px]">
            {car.make} {car.model}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-display text-[24px] font-semibold text-ink sm:text-[32px]">
              {formatUsd(car.price)}
            </span>
            <span className="rounded-pill border border-line-light px-3 py-1 text-[13px] font-medium text-muted">
              {conditionLabels[car.condition]}
            </span>
            {car.deliveryEtaDays && (
              <span className="rounded-pill border border-line-light px-3 py-1 text-[13px] font-medium text-muted">
                {interpolate(t.specs.deliveryEtaValue, { days: String(car.deliveryEtaDays) })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#loan-calculator"
            className="inline-flex min-h-11 items-center justify-center rounded-pill border border-ink px-6 py-3 text-[14px] font-bold text-ink transition-colors duration-standard hover:bg-ink hover:text-white"
          >
            {t.ctaLoan}
          </a>
          <button
            type="button"
            onClick={() =>
              openUniversal({ sourceCta: 'china-detail-per-car-offer', car: carContext })
            }
            className="inline-flex min-h-11 items-center justify-center rounded-pill bg-accent px-6 py-3 text-[14px] font-bold text-ink transition-colors duration-standard hover:bg-accent-600"
          >
            {interpolate(t.ctaOffer, { model: `${car.make} ${car.model}` })}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[850fr_471fr]">
        <CarGallery
          images={car.images}
          colorImageUrl={selectedColorImage}
          alt={`${car.make} ${car.model}`}
        />

        <div className="flex flex-col gap-10">
          <CarSpecs car={car} />

          {colors.length > 0 && (
            <div>
              <h2 className="font-display text-[24px] font-semibold leading-[32px] text-ink">
                {t.colorPicker.heading}
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    aria-label={color.name}
                    aria-pressed={selectedColor === color.name}
                    onClick={() =>
                      setSelectedColor((current) =>
                        current === color.name ? undefined : color.name,
                      )
                    }
                    className={`size-12 rounded-full border-2 transition-transform duration-standard ${
                      selectedColor === color.name
                        ? 'border-accent scale-110'
                        : 'border-line-light hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          <BuyWithLoan banks={banks} car={carContext} />
        </div>
      </div>
    </div>
  );
}
