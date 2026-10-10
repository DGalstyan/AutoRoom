'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { Car, FinanceCalculator } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';
import { Price } from '@/components/ui/Price';
import { computeMonthlyPaymentAmd, explainLoan, formatAmd } from '@/lib/loan';
import { interpolate } from '@/lib/messages';
import { useMessages } from '@/components/shared/LocaleProvider';

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
  const min = useMemo(
    () => Math.round(car.price * finance.minDownPaymentRatio),
    [car.price, finance.minDownPaymentRatio],
  );
  const max = useMemo(
    () => Math.round(car.price * finance.maxDownPaymentRatio),
    [car.price, finance.maxDownPaymentRatio],
  );
  const defaultDownPayment = useMemo(
    () => Math.round(car.price * finance.defaultDownPaymentRatio),
    [car.price, finance.defaultDownPaymentRatio],
  );
  const step = Math.max(100, Math.round(car.price * 0.01));

  const [downPayment, setDownPayment] = useState(defaultDownPayment);
  const clamped = Math.min(max, Math.max(min, downPayment));
  // While typing, the field shows exactly what was typed; it snaps into range on blur/Enter.
  const [draft, setDraft] = useState<string | null>(null);
  const draftNumber = draft === null ? null : Number(draft);
  const outOfRange = draft !== null && (draft === '' || draftNumber! < min || draftNumber! > max);

  function commit(value: number) {
    setDownPayment(Math.min(max, Math.max(min, Math.round(value))));
    setDraft(null);
  }
  const monthly = computeMonthlyPaymentAmd(car.price, clamped, finance);
  const why = explainLoan(car.price, clamped, finance);
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
            <label
              htmlFor="loan-down-payment"
              className="text-[16px] font-bold leading-5 text-neutral-800"
            >
              {t.downPayment}
            </label>
            {/* Figma 442:9222 — the car's price, in a 36px pill. */}
            <div className="flex h-9 items-center justify-between rounded-pill bg-neutral-25 py-1 pl-3 pr-3 text-[12px] font-medium leading-[18px] text-neutral-800">
              <span>{t.price}</span>
              <span className="tabular-nums">{formatUsd(car.price)}</span>
            </div>
            {/* The down payment: a real, full-size field (typing is free, the value is clamped when
                the visitor leaves it or presses Enter) with − / + steppers, not a tiny inline number. */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => commit(clamped - step)}
                disabled={clamped <= min}
                aria-label={t.downPaymentDecrease}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-25 text-[22px] leading-none text-neutral-800 transition-colors duration-standard hover:bg-neutral-50 disabled:opacity-40"
              >
                <span aria-hidden="true">−</span>
              </button>
              <div
                className={`flex h-11 min-w-0 flex-1 items-center gap-2 rounded-pill bg-neutral-25 px-4 focus-within:ring-2 focus-within:ring-accent ${outOfRange ? 'ring-1 ring-error' : ''}`}
              >
                <span aria-hidden="true" className="text-[16px] text-neutral-600">
                  $
                </span>
                <input
                  id="loan-down-payment"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={draft ?? String(clamped)}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '').slice(0, 9);
                    setDraft(digits);
                    const n = Number(digits);
                    if (digits !== '' && n >= min && n <= max) setDownPayment(n);
                  }}
                  onBlur={() => commit(draft === null ? clamped : Number(draft) || min)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      commit(draft === null ? clamped : Number(draft) || min);
                    }
                  }}
                  aria-invalid={outOfRange || undefined}
                  aria-describedby="loan-down-payment-range"
                  className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-bold tabular-nums text-neutral-900 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => commit(clamped + step)}
                disabled={clamped >= max}
                aria-label={t.downPaymentIncrease}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-25 text-[22px] leading-none text-neutral-800 transition-colors duration-standard hover:bg-neutral-50 disabled:opacity-40"
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={clamped}
              onChange={(event) => setDownPayment(Number(event.target.value))}
              className={`-my-[7px] h-11 w-full appearance-none bg-transparent ${THUMB}`}
              aria-label={t.downPayment}
            />
            <p
              id="loan-down-payment-range"
              className={`flex justify-between text-[12px] font-medium leading-[18px] tabular-nums ${outOfRange ? 'text-error' : 'text-neutral-700'}`}
            >
              <span>
                {t.downPaymentMin}: {formatUsd(min)}
              </span>
              <span>
                {t.downPaymentMax}: {formatUsd(max)}
              </span>
            </p>
            {outOfRange && (
              <p role="alert" className="text-[12px] leading-4 text-error">
                {interpolate(t.downPaymentRange, { min: formatUsd(min), max: formatUsd(max) })}
              </p>
            )}
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

        <div className="relative flex w-full flex-col gap-4 overflow-hidden rounded-[20px] bg-white px-6 py-8 lg:min-h-[338px] lg:w-[589px] lg:px-0 lg:py-0 lg:pb-[60px] lg:pl-12 lg:pt-[60px]">
          {/* Figma 442:9250 — labels 16/24 regular, values 16/20 bold, both #666E73. */}
          <div className="relative z-10 flex flex-col gap-[10px] text-neutral-700 lg:w-[265px]">
            <div>
              <p className="type-body">{t.downPayment}</p>
              <p className="text-[16px] font-bold leading-5 tabular-nums">{formatUsd(clamped)}</p>
            </div>
            <div>
              <p className="type-body">{t.term}</p>
              <p className="text-[16px] font-bold leading-5 tabular-nums">{finance.termMonths}</p>
            </div>
          </div>
          <hr className="relative z-10 my-1 border-0 border-t border-neutral-100 lg:w-[226px]" />
          <div className="relative z-10">
            <p className="stretch-90 text-[20px] font-bold leading-8 text-neutral-900">
              {t.monthly}
            </p>
            {/* The one big number: 28px on phones, 36px from sm, always 700 (the Price "total" size). */}
            <Price as="p" size="total" className="text-neutral-900">
              {formatAmd(monthly)}
            </Price>
          </div>
          {carImage && (
            <div className="pointer-events-none absolute bottom-4 right-4 z-0 hidden h-[164px] w-[246px] overflow-hidden rounded-[24px] sm:block">
              <Image src={carImage} alt="" fill sizes="246px" className="object-cover" />
            </div>
          )}
        </div>
      </div>
      <section
        aria-labelledby="loan-explain-heading"
        className="flex flex-col gap-4 rounded-[20px] bg-white p-6 text-neutral-700 lg:p-9"
      >
        <h3
          id="loan-explain-heading"
          className="stretch-90 text-[20px] font-bold leading-8 text-neutral-900"
        >
          {t.explainHeading}
        </h3>
        <dl className="grid gap-5 text-[14px] leading-6 lg:grid-cols-2 lg:gap-x-12">
          <div>
            <dt className="font-bold text-neutral-800">{t.explainDownTitle}</dt>
            <dd>
              {interpolate(t.explainDownText, {
                min: formatUsd(why.minUsd),
                minPct: String(why.minPct),
                current: formatUsd(why.downUsd),
                currentPct: String(why.downPct),
                max: formatUsd(why.maxUsd),
                maxPct: String(why.maxPct),
              })}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-neutral-800">{t.explainPrincipalTitle}</dt>
            <dd className="tabular-nums">
              {interpolate(t.explainPrincipalText, {
                price: formatUsd(car.price),
                down: formatUsd(why.downUsd),
                rate: String(finance.usdToAmd),
                amount: formatAmd(why.principalAmd),
              })}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-neutral-800">{t.explainTermTitle}</dt>
            <dd className="tabular-nums">
              {interpolate(t.explainTermText, {
                n: String(why.termMonths),
                annual: String(finance.nominalRate),
                monthly: String(why.monthlyRatePct),
              })}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-neutral-800">{t.explainFormulaTitle}</dt>
            <dd>
              <p className="font-bold tabular-nums text-neutral-900">{t.explainFormula}</p>
              <p className="mt-1 text-[12px] leading-4">{t.explainLegend}</p>
              <p className="mt-1 font-bold tabular-nums text-neutral-900">
                {interpolate(t.explainResult, { monthly: formatAmd(why.monthlyPaymentAmd) })}
              </p>
            </dd>
          </div>
        </dl>
      </section>
      {finance.disclaimer && (
        <p className="max-w-2xl text-[12px] leading-4 text-neutral-700">{finance.disclaimer}</p>
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
