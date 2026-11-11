'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { Car, FinanceCalculator } from '@/lib/types/car';
import { formatUsdTight } from '@/lib/types/car';
import { Price } from '@/components/ui/Price';
import { computeMonthlyPaymentAmd, formatAmd } from '@/lib/loan';
import { useLocale, useMessages } from '@/components/shared/LocaleProvider';

/**
 * China/USA car-detail S3.6b — "Վարկի պայմաններ" real-time
 * calculator. Figma node 102:278: a left-aligned page heading (not inside a
 * card, matching "Գնի ճանապարհը"/"Նմանատիպ առաջարկներ" on the same page)
 * over two independent white cards — a down-payment editor + term/rate rows
 * on the left, a single big result card on the right. Term/rates/USD→AMD
 * come from the admin-managed `finance.calculator` setting (`lib/settings.ts`)
 * rather than being hardcoded, so a rate change in admin updates every car's
 * calculator without a deploy. The result card's corner carries the car's own
 * photo — a real-data stand-in for the Figma mock's unrelated stock image.
 */
export function LoanCalculator({
  car,
  finance,
}: {
  car: Pick<Car, 'price' | 'images'>;
  finance: FinanceCalculator;
}) {
  const t = useMessages().common.carDetail.loanCalculator;
  const locale = useLocale();
  // The admin enters the small print in Armenian; other languages show their own text, or nothing.
  const disclaimer =
    locale === 'hy' ? finance.disclaimer : (finance.disclaimerTranslations?.[locale] ?? null);
  // The "Գին" field: starts at the car's price and can be edited; everything below is worked out from it.
  const [price, setPrice] = useState(car.price);
  const [priceDraft, setPriceDraft] = useState<string | null>(null);
  const min = useMemo(
    () => Math.round(price * finance.minDownPaymentRatio),
    [price, finance.minDownPaymentRatio],
  );
  const max = useMemo(
    () => Math.round(price * finance.maxDownPaymentRatio),
    [price, finance.maxDownPaymentRatio],
  );
  const defaultDownPayment = useMemo(
    () => Math.round(price * finance.defaultDownPaymentRatio),
    [price, finance.defaultDownPaymentRatio],
  );
  const step = Math.max(100, Math.round(price * 0.01));

  const [downPayment, setDownPayment] = useState(defaultDownPayment);
  // While the field has focus it shows what is being typed; otherwise the clamped, formatted amount.
  const [draft, setDraft] = useState<string | null>(null);
  const clamped = Math.min(max, Math.max(min, downPayment));
  const monthly = price > 0 ? computeMonthlyPaymentAmd(price, clamped, finance) : 0;
  const carImage = car.images[0]?.thumbnailUrl ?? car.images[0]?.url;

  const THUMB =
    '[&::-webkit-slider-thumb]:-mt-[10px] [&::-webkit-slider-thumb]:size-[30px] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[url(/images/china/filters/knob.svg)] [&::-webkit-slider-thumb]:bg-contain [&::-moz-range-thumb]:size-[30px] [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[url(/images/china/filters/knob.svg)] [&::-moz-range-thumb]:bg-contain [&::-moz-range-track]:h-[9px] [&::-moz-range-track]:rounded-pill [&::-moz-range-track]:bg-neutral-25 [&::-webkit-slider-runnable-track]:h-[9px] [&::-webkit-slider-runnable-track]:rounded-pill [&::-webkit-slider-runnable-track]:bg-neutral-25';

  return (
    <div id="loan-calculator" className="flex flex-col gap-8 lg:gap-16">
      <h2 className="type-h2 text-neutral-900">{t.heading}</h2>

      {/* Figma 442:9210: a 676px column (input card + three rows) and a 589px result card. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-6 lg:w-[676px]">
          <div className="flex flex-col gap-[10px] rounded-[12px] bg-white p-6">
            <p className="text-[16px] font-bold leading-5 text-neutral-800">{t.downPayment}</p>
            {/* Figma 442:9222 — the "Գին" pill. It is a field: type another price and the down payment range,
                the slider and the monthly payment are all worked out from it. */}
            <label className="flex h-9 items-center justify-between gap-3 rounded-pill bg-neutral-25 py-1 pl-3 pr-3 text-[12px] font-medium leading-[18px] text-neutral-800 focus-within:ring-1 focus-within:ring-accent">
              <span>{t.price}</span>
              <input
                id="loan-price"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label={t.price}
                value={priceDraft ?? formatUsdTight(price)}
                onFocus={(event) => {
                  setPriceDraft(String(price));
                  event.currentTarget.select();
                }}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '').slice(0, 9);
                  setPriceDraft(digits);
                  const next = digits === '' ? 0 : Number(digits);
                  setPrice(next);
                  // A new price starts again from the usual share down, rather than keeping a stale amount.
                  setDownPayment(Math.round(next * finance.defaultDownPaymentRatio));
                }}
                onBlur={() => setPriceDraft(null)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
                className="min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none"
              />
            </label>
            {/* Figma 474:2905 draws the chosen amount as plain 12px text above the slider; it is a real field so an
                exact amount can be typed. It follows the slider, and the slider and result follow it. */}
            <input
              id="loan-down-payment-value"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label={t.downPayment}
              value={draft ?? formatUsdTight(clamped)}
              onFocus={(event) => {
                setDraft(String(clamped));
                event.currentTarget.select();
              }}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 9);
                setDraft(digits);
                setDownPayment(digits === '' ? 0 : Number(digits));
              }}
              onBlur={() => setDraft(null)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
              className="-mx-1 w-full rounded-[6px] bg-transparent px-1 text-[12px] font-medium leading-[18px] tabular-nums text-neutral-800 outline-none transition-colors duration-standard hover:bg-neutral-25 focus:bg-neutral-25 focus-visible:ring-1 focus-visible:ring-accent"
            />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={clamped}
              onChange={(event) => setDownPayment(Number(event.target.value))}
              className={`-my-[7px] h-11 w-full appearance-none bg-transparent ${THUMB}`}
              aria-label={t.downPayment}
              aria-describedby="loan-down-payment-value"
            />
          </div>

          <div className="flex flex-col gap-2">
            <SpecRow label={t.term} value={String(finance.termMonths)} />
            <SpecRow label={t.nominalRate} value={`${finance.nominalRate} %`} />
            <SpecRow
              label={t.effectiveRate}
              value={`${finance.effectiveRateMin} - ${finance.effectiveRateMax} %`}
            />
          </div>
        </div>

        <div className="relative flex w-full flex-col gap-4 overflow-hidden rounded-[20px] bg-white px-6 py-8 lg:min-h-[338px] lg:w-[589px] lg:px-0 lg:py-0 lg:pb-[60px] lg:pl-[100px] lg:pt-[60px]">
          {/* Figma 442:9250 — labels 16/24 regular, values 16/20 bold, both #666E73. */}
          <div className="relative z-10 flex flex-col gap-[10px] text-neutral-700 lg:w-[265px]">
            <div>
              <p className="type-body">{t.downPayment}</p>
              <p className="text-[16px] font-bold leading-5 tabular-nums">
                {formatUsdTight(clamped)}
              </p>
            </div>
            <div>
              <p className="type-body">{t.term}</p>
              <p className="text-[16px] font-bold leading-5 tabular-nums">{finance.termMonths}</p>
            </div>
          </div>
          <hr className="relative z-10 my-0 border-0 border-t border-neutral-100 lg:w-[226px]" />
          <div className="relative z-10">
            <p className="stretch-90 text-[20px] font-bold leading-8 text-neutral-900">
              {t.monthly}
            </p>
            {/* The one big number: 28px on phones, 36px from sm, always 700 (the Price "total" size). */}
            <Price as="p" size="total" className="text-neutral-900 lg:mt-[5px]">
              {formatAmd(monthly)}
            </Price>
          </div>
          {carImage && (
            <>
              {/* Phones: the photo in the corner, as before. */}
              <div className="pointer-events-none absolute bottom-4 right-4 z-0 hidden h-[120px] w-[180px] overflow-hidden rounded-[24px] sm:block lg:hidden">
                <Image src={carImage} alt="" fill sizes="180px" className="object-cover" />
              </div>
              {/* Figma 474:2905 puts a cut-out car bottom-right (245×107). A real photo has a background, so it stays
                  inside the card, feathered into it, rather than hanging over the edge. */}
              <div
                className="pointer-events-none absolute bottom-4 right-4 z-0 hidden h-[107px] w-[200px] overflow-hidden rounded-[24px] lg:block"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0%, #000 28%), linear-gradient(to bottom, transparent 0%, #000 30%)',
                  WebkitMaskComposite: 'source-in',
                  maskImage:
                    'linear-gradient(to right, transparent 0%, #000 28%), linear-gradient(to bottom, transparent 0%, #000 30%)',
                  maskComposite: 'intersect',
                }}
              >
                <Image src={carImage} alt="" fill sizes="200px" className="object-cover" />
              </div>
            </>
          )}
        </div>
      </div>
      {disclaimer && (
        <p className="max-w-2xl text-[12px] leading-4 text-neutral-700">{disclaimer}</p>
      )}
    </div>
  );
}

/** One term/rate row — a white 12px-corner strip, label left, bold value from x=353 (Figma 442:9239). */
function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-[12px] bg-white p-3">
      <span className="type-body stretch-90 w-1/2 text-neutral-700 lg:w-[341px] lg:flex-none">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-[16px] font-bold leading-5 tabular-nums text-neutral-800">
        {value}
      </span>
    </div>
  );
}
