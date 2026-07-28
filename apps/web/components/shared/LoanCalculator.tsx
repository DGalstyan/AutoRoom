'use client';

import { useId, useMemo, useState } from 'react';
import { Slider } from '@/components/ui';
import { DEFAULT_LOAN_CONFIG, calculateMonthly, usdToAmd, type LoanConfig } from '@/lib/loan';
import { AMD_SYMBOL, formatAmd, formatAmdNumber, parseAmount } from '@/lib/format';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * "Վարկի պայմաններ" — the real-time financing card on China and USA-available
 * car details.
 *
 * The interaction the spec is specific about: **no "Հաշվել" button**. The
 * monthly payment recomputes as the down payment moves, and the number input and
 * the slider are two views of the same value.
 */

export interface LoanCalculatorProps {
  /** Catalogue price in USD; the card quotes in drams. */
  priceUsd: number;
  /** Per-campaign overrides (term, rates, FX). */
  config?: Partial<LoanConfig>;
  /** Sticky in the car-detail right column on desktop. */
  sticky?: boolean;
  className?: string;
  id?: string;
}

export function LoanCalculator({
  priceUsd,
  config: overrides,
  sticky = false,
  className,
  id,
}: LoanCalculatorProps) {
  const config = useMemo(() => ({ ...DEFAULT_LOAN_CONFIG, ...overrides }), [overrides]);
  const priceAmd = Math.round(usdToAmd(priceUsd, config));

  const min = Math.round(priceAmd * config.minDownPaymentRatio);
  const max = Math.round(priceAmd * config.maxDownPaymentRatio);
  const step = 10_000;

  const [downPayment, setDownPayment] = useState(() =>
    Math.round(priceAmd * config.defaultDownPaymentRatio),
  );
  const inputId = useId();

  const monthly = calculateMonthly(priceAmd, downPayment, config);

  return (
    <section
      id={id}
      aria-labelledby={`${inputId}-title`}
      className={cn(
        'rounded-lg border border-line-light bg-paper p-6 shadow-card',
        sticky && 'lg:sticky lg:top-[calc(var(--header-height)+24px)]',
        className,
      )}
    >
      <h3 id={`${inputId}-title`} className="text-h3">
        {t('loan.title')}
      </h3>
      <hr className="my-4 border-line-light" />

      <div className="flex flex-col gap-3">
        <label htmlFor={inputId} className="text-small font-medium">
          {t('loan.downPayment')}
        </label>
        <div className="flex items-center gap-2 rounded-md border border-line-light px-4 py-3 focus-within:border-ink">
          <input
            id={inputId}
            value={formatAmdNumber(downPayment)}
            onChange={(event) => {
              // Clamped to the ceiling on every keystroke but only to the floor
              // on blur — otherwise clearing the field snaps it to the minimum
              // mid-edit and the user cannot type a new number.
              setDownPayment(Math.min(max, parseAmount(event.target.value)));
            }}
            onBlur={() => setDownPayment((current) => Math.max(min, current))}
            inputMode="numeric"
            className="w-full bg-transparent text-lead font-semibold tabular-nums outline-none"
            aria-describedby={`${inputId}-currency`}
          />
          <span id={`${inputId}-currency`} className="text-muted">
            {AMD_SYMBOL}
          </span>
        </div>

        <Slider
          label={t('loan.downPayment')}
          hideLabel
          value={Math.min(Math.max(downPayment, min), max)}
          min={min}
          max={max}
          step={step}
          onChange={setDownPayment}
          formatValue={formatAmd}
        />
      </div>

      <dl className="mt-6 flex flex-col gap-3">
        <Row label={t('loan.term')} value={String(config.termMonths)} />
        <Row label={t('loan.nominalRate')} value={`${config.nominalRate} %`} />
        <Row
          label={t('loan.effectiveRate')}
          value={`${config.effectiveRateMin} - ${config.effectiveRateMax} %`}
        />
      </dl>

      <hr className="my-5 border-line-light" />

      {/* The most emphasised element on the card. `aria-live` keeps the value
          announced as the slider moves without re-reading the whole card. */}
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-small font-medium">{t('loan.monthlyPayment')}</span>
        <span aria-live="polite" className="text-h2 font-bold tabular-nums">
          {formatAmd(monthly)}
        </span>
      </div>

      <p className="mt-4 text-caption text-muted">{t('loan.disclaimer')}</p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="text-small font-bold tabular-nums">{value}</dd>
    </div>
  );
}
