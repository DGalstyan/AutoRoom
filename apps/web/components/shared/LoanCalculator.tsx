'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { Car, FinanceCalculator } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';
import { computeMonthlyPaymentAmd, formatAmd } from '@/lib/loan';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * China (and later USA) car-detail S3.6b — "Վարկի պայմաններ" real-time
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
  const t = useMessages().china.detail.loanCalculator;
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
  const monthly = computeMonthlyPaymentAmd(car.price, clamped, finance);
  const carImage = car.images[0]?.url;

  return (
    <div id="loan-calculator" className="flex flex-col gap-16">
      <h2 className="font-display text-home-h2 font-light text-neutral-900">{t.heading}</h2>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex flex-col gap-6 lg:flex-[676]">
          <div className="flex flex-col gap-3 rounded-md bg-white p-6">
            <label htmlFor="loan-down-payment" className="text-[16px] font-bold text-neutral-800">
              {t.downPayment}
            </label>
            <input
              id="loan-down-payment"
              type="number"
              min={min}
              max={max}
              step={step}
              value={clamped}
              onChange={(event) => setDownPayment(Number(event.target.value) || min)}
              className="w-32 rounded-pill bg-neutral-25 px-3 py-1 text-[12px] font-medium text-neutral-800"
            />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={clamped}
              onChange={(event) => setDownPayment(Number(event.target.value))}
              className="h-[9px] w-full appearance-none rounded-pill bg-neutral-25 accent-accent"
              aria-label={t.downPayment}
            />
            <div className="flex justify-between text-[12px] text-neutral-700">
              <span>{formatUsd(min)}</span>
              <span>{formatUsd(max)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Row label={t.term} value={String(finance.termMonths)} />
            <Row label={t.nominalRate} value={`${finance.nominalRate}%`} />
            <Row
              label={t.effectiveRate}
              value={`${finance.effectiveRateMin} - ${finance.effectiveRateMax}%`}
            />
          </div>
        </div>

        <div className="relative flex w-full flex-col gap-4 overflow-hidden rounded-[20px] bg-white p-8 sm:p-12 lg:flex-[589]">
          <div className="flex flex-col gap-1">
            <span className="text-[16px] text-neutral-700">{t.downPayment}</span>
            <span className="text-[16px] font-bold text-neutral-700">{formatUsd(clamped)}</span>
          </div>
          <div className="h-px w-full max-w-[226px] bg-line-light" />
          <div>
            <p className="text-[20px] font-bold text-neutral-900">{t.monthly}</p>
            <p className="font-display text-[36px] font-bold leading-[56px] text-neutral-900">
              {formatAmd(monthly)}
            </p>
          </div>
          {finance.disclaimer && (
            <p className="max-w-xs text-[12px] leading-[16px] text-neutral-700">
              {finance.disclaimer}
            </p>
          )}

          {carImage && (
            <div className="pointer-events-none absolute bottom-6 right-6 hidden h-[110px] w-[164px] overflow-hidden rounded-xl sm:block">
              <Image src={carImage} alt="" fill sizes="164px" className="object-cover" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white p-3">
      <span className="text-[16px] text-neutral-700">{label}</span>
      <span className="text-[16px] font-bold text-neutral-800">{value}</span>
    </div>
  );
}
