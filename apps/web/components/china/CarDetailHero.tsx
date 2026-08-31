'use client';

import { useState } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { CarGallery } from '@/components/shared/CarGallery';
import { CarSpecs } from '@/components/shared/CarSpecs';
import { BuyWithLoan } from '@/components/shared/BuyWithLoan';
import type { Car } from '@/lib/types/car';
import { carHref, formatUsd } from '@/lib/types/car';
import type { Bank } from '@/lib/banks';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * China (and later USA) car-detail S3.1–3.3 + 3.6b: the name/price title
 * bar with the two CTAs, the image gallery, the order-only colour picker
 * (only `ON_ORDER` cars carry meaningful `car.colors` — an in-stock car is
 * one specific physical car in one specific colour, per
 * `apps/api/prisma/schema.prisma`'s `colors` comment) and the compact
 * `BuyWithLoan` bank grid. One client component because the colour picker,
 * gallery and both CTAs all share the same `selectedColor` state. Pixel-
 * matched to Figma node 102:476 (file 9Lq4XpWusTJj1VnM6laAZr):
 * - the title bar is a plain white pill, not `sticky` — it scrolls away with
 *   the rest of the hero like everything else on the page;
 * - neither a condition nor a delivery-ETA badge sits next to the price here
 *   — both already live in the spec table below, and this frame doesn't
 *   repeat them;
 * - the gallery+specs block sits on its own slightly-off-white backdrop,
 *   not the page's plain background.
 */
export function CarDetailHero({ car, banks }: { car: Car; banks: Bank[] }) {
  const t = useMessages().china.detail;
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
    <div className="flex flex-col gap-9">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-6 whitespace-nowrap">
          <h1 className="font-display text-[36px] font-bold leading-[56px] text-neutral-900">
            {car.make} {car.model}
          </h1>
          <span className="font-display text-[24px] font-light leading-[36px] text-neutral-900">
            {formatUsd(car.price)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#loan-calculator"
            className="inline-flex h-12 items-center gap-1 rounded-pill bg-neutral-50 px-6 text-[14px] text-neutral-900 transition-colors duration-standard hover:bg-neutral-100"
          >
            {t.ctaLoan}
            <ArrowGlyph />
          </a>
          <button
            type="button"
            onClick={() =>
              openUniversal({ sourceCta: 'china-detail-per-car-offer', car: carContext })
            }
            className="inline-flex h-12 items-center gap-1 rounded-pill bg-accent px-6 text-[14px] text-neutral-900 transition-colors duration-standard hover:bg-accent-600"
          >
            {t.ctaOffer}
            <ArrowGlyph />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 bg-surface-light py-12 lg:flex-row lg:items-start">
        <div className="lg:flex-[850]">
          <CarGallery
            images={car.images}
            colorImageUrl={selectedColorImage}
            alt={`${car.make} ${car.model}`}
          />
        </div>

        <div className="flex flex-col gap-9 lg:flex-[471]">
          <CarSpecs car={car} />

          {colors.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-[20px] font-bold leading-[32px] text-neutral-800">
                {t.colorPicker.heading}
              </h2>
              <div className="flex w-full items-center justify-between">
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
                    className={`size-12 rounded-md transition-colors duration-standard ${
                      selectedColor === color.name
                        ? 'border-2 border-neutral-800'
                        : isPaleColor(color.hex)
                          ? 'border border-neutral-500'
                          : 'border-2 border-transparent'
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

/** Near-white swatches need a hairline border to stay visible against a light backdrop. */
function isPaleColor(hex: string): boolean {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return false;
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  // Perceptual luminance; matches how a human eye picks "too pale to see" over raw averaging.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 230;
}

function ArrowGlyph() {
  return (
    <span className="flex size-5 rotate-45 items-center justify-center" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 12 12 4M12 4H5M12 4v7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
