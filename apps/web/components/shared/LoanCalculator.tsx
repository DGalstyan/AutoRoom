'use client';

import { useMemo, useState } from 'react';
import type { Car, FinanceCalculator } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';
import { computeMonthlyPaymentAmd, formatAmd } from '@/lib/loan';
import { messages } from '@/lib/messages';

const t = messages.china.detail.loanCalculator;

/**
 * China (and later USA) car-detail S3.6b — "Վարկի պայմաններ" real-time
 * calculator, per `components.md`: down-payment input synced with a slider,
 * term/rate rows, big bold monthly result, no "Հաշվել" button. Term/rates/
 * USD→AMD come from the admin-managed `finance.calculator` setting
 * (`lib/settings.ts`) rather than being hardcoded, so a rate change in admin
 * updates every car's calculator without a deploy. Figma node 102:278.
 */
export function LoanCalculator({
  car,
  finance,
}: {
  car: Pick<Car, 'price'>;
  finance: FinanceCalculator;
}) {
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

  return (
    <div id="loan-calculator" className="rounded-[32px] bg-white p-6 sm:p-8">
      <h2 className="font-display text-[24px] font-semibold leading-[32px] text-ink">
        {t.heading}
      </h2>
      <div className="mt-4 border-t border-line-light pt-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="loan-down-payment" className="text-[14px] font-medium text-ink">
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
                  className="w-32 rounded-md border border-line-light px-2 py-1 text-right text-[14px]"
                />
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={clamped}
                onChange={(event) => setDownPayment(Number(event.target.value))}
                className="h-[9px] w-full appearance-none rounded-pill bg-neutral-100 accent-accent"
                aria-label={t.downPayment}
              />
              <div className="mt-1 flex justify-between text-[12px] text-muted">
                <span>{formatUsd(min)}</span>
                <span>{formatUsd(max)}</span>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-line-light">
              <Row label={t.term} value={String(finance.termMonths)} />
              <Row label={t.nominalRate} value={`${finance.nominalRate}%`} />
              <Row
                label={t.effectiveRate}
                value={`${finance.effectiveRateMin} - ${finance.effectiveRateMax}%`}
              />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2 rounded-[20px] bg-surface-light p-6">
            <span className="text-[16px] text-muted">{t.monthly}</span>
            <span className="font-display text-[40px] font-bold leading-[48px] text-ink">
              {formatAmd(monthly)}
            </span>
            {finance.disclaimer && (
              <p className="mt-2 text-[12px] leading-[16px] text-muted">{finance.disclaimer}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[14px] text-muted">{label}</span>
      <span className="text-[14px] font-semibold text-ink">{value}</span>
    </div>
  );
}
