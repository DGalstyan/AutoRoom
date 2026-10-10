'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import { Field as UiField, type FieldControlProps } from '@/components/ui/Field';
import { interpolate } from '@/lib/messages';
import { formatAmd } from '@/lib/loan';
import { formatUsd } from '@/lib/types/car';
import {
  computeCustoms,
  validateCustomsInput,
  type CustomsErrorKey,
  type CustomsField,
  type CustomsInput,
  type CustomsRates,
  type CustomsResult,
} from '@/lib/customs';

import type { Age, Powertrain } from '@/lib/customs';
type VehicleType = 'sedan' | 'suv' | 'pickup' | 'hatchback' | 'minivan';
type Auction = 'manheim' | 'iaai' | 'copart';

const POWERTRAINS: Powertrain[] = ['BENZIN', 'HYBRID', 'EV'];
const AGES: Age[] = ['under3', 'between3And5', 'between5And10', 'over10'];
const VEHICLE_TYPES: VehicleType[] = ['sedan', 'suv', 'pickup', 'hatchback', 'minivan'];
const AUCTIONS: Auction[] = ['manheim', 'iaai', 'copart'];

const CURRENT_YEAR = new Date().getFullYear();
const PRODUCTION_YEARS = Array.from({ length: 20 }, (_, index) => CURRENT_YEAR - index);

/**
 * USA S2.4 — "Մաքսազերծման հաշվիչ" (Figma node 282:1699, file
 * 9Lq4XpWusTJj1VnM6laAZr — this section sits in an otherwise-unlinked part
 * of the file with no obvious parent page frame; found by walking sibling
 * node ids up from the heading text at 282:1704, not from a labeled page
 * frame). Figma mocks the 9-field form and a "Հաշվել" button and nothing past it, so
 * the result panel, formula and validation are ours. Customs amounts are legally binding, so
 * no rate is built in: duty %, VAT %, excise per cm³ by age band and the exchange rate (with
 * its source and date) all come from the admin `finance.customs` setting. While one is blank
 * the calculator shows what it can work out and hands the rest to a specialist through the
 * Universal lead popup, the same hand-off every other "exact number" moment on the site uses.
 * The math lives in `lib/customs.ts` (tested); this file is the form and the breakdown.
 *
 * The two auction-house logo assets in Figma's own mock (`Ameriabank`/
 * `evokabank` fills under an "Աճուրդ" field) are mislabeled bank logos, not
 * real auction branding — a copy-paste artifact like the several others
 * already documented in this file (`PartnersWhoCanJoin`, `AuctionFollowAlong`).
 * Rendered as plain text toggles instead of chasing down real Manheim/IAAI/
 * Copart marks.
 *
 * Auction-location options reuse `usa.stateClocks.states` — the same
 * curated US state list `UsaStateClocks` already offers — rather than a
 * second hardcoded list.
 */
export function CustomsCalculator({
  rates,
  fallbackUsdToAmd,
}: {
  rates: CustomsRates;
  /** The loan calculator's rate, used when no customs-specific rate is set. */
  fallbackUsdToAmd: number | null;
}) {
  const t = useMessages().usa.customsCalculator;
  const stateLabels = useMessages().usa.stateClocks.states;
  const { openUniversal } = useLeadWidgets();

  const [carValue, setCarValue] = useState('');
  const [auction, setAuction] = useState<Auction | null>(null);
  const [auctionLocation, setAuctionLocation] = useState('');
  const [transportFee, setTransportFee] = useState('');
  const [engineType, setEngineType] = useState<Powertrain | ''>('');
  const [age, setAge] = useState<Age | ''>('');
  const [productionYear, setProductionYear] = useState('');
  const [engineVolume, setEngineVolume] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [errors, setErrors] = useState<Partial<Record<CustomsField, CustomsErrorKey>>>({});
  const [result, setResult] = useState<CustomsResult | null>(null);

  const powertrainLabels = useMessages().common.carDetail.specs.powertrain;
  const stateLabelByKey = stateLabels as Record<string, string>;
  const stateOptions = useMemo(() => Object.entries(stateLabels), [stateLabels]);

  const toNumber = (raw: string) => {
    const trimmed = raw.trim();
    return trimmed === '' ? null : Number(trimmed);
  };

  function currentInput(): CustomsInput {
    return {
      carValueUsd: toNumber(carValue),
      transportUsd: toNumber(transportFee),
      powertrain: engineType,
      age,
      productionYear: toNumber(productionYear),
      engineVolumeCm3: toNumber(engineVolume),
    };
  }

  function leadComment(): string {
    const lines = [
      [t.carValueLabel, carValue && `$${carValue}`],
      [t.auctionLabel, auction && t.auctionOptions[auction]],
      [t.auctionLocationLabel, auctionLocation && stateLabelByKey[auctionLocation]],
      [t.transportFeeLabel, transportFee && `$${transportFee}`],
      [t.engineTypeLabel, engineType && powertrainLabels[engineType]],
      [t.ageLabel, age && t.ageOptions[age]],
      [t.productionYearLabel, productionYear],
      [t.engineVolumeLabel, engineVolume],
      [t.vehicleTypeLabel, vehicleType && t.vehicleTypeOptions[vehicleType]],
    ]
      .filter(([, value]) => Boolean(value))
      .map(([label, value]) => `${label}: ${value}`);
    if (result?.status === 'ok') {
      lines.push(`${t.result.total}: ${formatAmd(result.breakdown.totalAmd)}`);
    }
    return [t.leadCommentHeading, ...lines].join('\n');
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input = currentInput();
    const found = validateCustomsInput(input);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setResult(null);
      return;
    }
    setResult(computeCustoms(input, rates, fallbackUsdToAmd));
  }

  function askSpecialist() {
    openUniversal({ sourceCta: 'usa-customs-calculator', comment: leadComment() });
  }

  const err = (field: CustomsField) => (errors[field] ? t.errors[errors[field]!] : null);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t.carValueLabel} error={err('carValue')}>
          {(a11y) => <NumberInput {...a11y} value={carValue} onChange={setCarValue} prefix="$" />}
        </Field>

        <Field label={t.auctionLabel} group>
          {() => (
            <div className="flex h-[52px] gap-1 rounded-pill bg-neutral-25 p-1">
              {AUCTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={auction === option}
                  onClick={() => setAuction(option)}
                  className={`flex-1 rounded-pill text-[12px] font-medium transition-colors ${
                    auction === option ? 'bg-neutral-700 text-white' : 'text-neutral-800'
                  }`}
                >
                  {t.auctionOptions[option]}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label={t.auctionLocationLabel}>
          {(a11y) => (
            <SelectInput
              {...a11y}
              value={auctionLocation}
              onChange={setAuctionLocation}
              placeholder={t.auctionLocationPlaceholder}
            >
              {stateOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field label={t.transportFeeLabel} error={err('transport')}>
          {(a11y) => (
            <NumberInput {...a11y} value={transportFee} onChange={setTransportFee} prefix="$" />
          )}
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={t.engineTypeLabel} error={err('engineType')}>
          {(a11y) => (
            <SelectInput
              {...a11y}
              value={engineType}
              onChange={(v) => setEngineType(v as Powertrain)}
            >
              {POWERTRAINS.map((option) => (
                <option key={option} value={option}>
                  {powertrainLabels[option]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field label={t.ageLabel} error={err('age')}>
          {(a11y) => (
            <SelectInput {...a11y} value={age} onChange={(v) => setAge(v as Age)}>
              {AGES.map((option) => (
                <option key={option} value={option}>
                  {t.ageOptions[option]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field label={t.productionYearLabel} error={err('productionYear')}>
          {(a11y) => (
            <SelectInput {...a11y} value={productionYear} onChange={setProductionYear}>
              {PRODUCTION_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field label={t.engineVolumeLabel} error={err('engineVolume')}>
          {(a11y) => <NumberInput {...a11y} value={engineVolume} onChange={setEngineVolume} />}
        </Field>

        <Field label={t.vehicleTypeLabel}>
          {(a11y) => (
            <SelectInput
              {...a11y}
              value={vehicleType}
              onChange={(v) => setVehicleType(v as VehicleType)}
            >
              {VEHICLE_TYPES.map((option) => (
                <option key={option} value={option}>
                  {t.vehicleTypeOptions[option]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 w-fit shrink-0 items-center justify-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {t.submit}
      </button>

      {result && (
        <CustomsResultPanel
          result={result}
          rates={rates}
          fallbackUsdToAmd={fallbackUsdToAmd}
          onAsk={askSpecialist}
        />
      )}
    </form>
  );
}

const CALC_LABEL = 'text-[12px] font-medium text-neutral-700';

function Field({
  label,
  group,
  error,
  children,
}: {
  label: string;
  group?: boolean;
  error?: string | null;
  children: (props: FieldControlProps) => ReactNode;
}) {
  return (
    <UiField
      label={label}
      group={group}
      error={error}
      labelClassName={CALC_LABEL}
      className="gap-2"
    >
      {children}
    </UiField>
  );
}

function NumberInput({
  value,
  onChange,
  prefix,
  ...a11y
}: FieldControlProps & {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
}) {
  return (
    <div
      className={`flex h-11 items-center gap-1 rounded-pill bg-neutral-25 px-3 ${a11y['aria-invalid'] ? 'ring-1 ring-error' : ''}`}
    >
      {prefix && <span className="text-[12px] text-neutral-600">{prefix}</span>}
      <input
        {...a11y}
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full bg-transparent text-[12px] font-medium text-neutral-800 outline-none"
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  placeholder,
  children,
  ...a11y
}: FieldControlProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
}) {
  return (
    <select
      {...a11y}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full appearance-none rounded-pill bg-neutral-25 px-3 text-[12px] aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-error font-medium text-neutral-800 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22 fill=%22none%22><path d=%22M4 6l4 4 4-4%22 stroke=%22%23999EA1%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[length:14px] bg-[position:right_12px_center] bg-no-repeat pr-8"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

/** The breakdown: every line of the formula with its number, then the total and where the rate comes from. */
function CustomsResultPanel({
  result,
  rates,
  fallbackUsdToAmd,
  onAsk,
}: {
  result: CustomsResult;
  rates: CustomsRates;
  fallbackUsdToAmd: number | null;
  onAsk: () => void;
}) {
  const t = useMessages().usa.customsCalculator.result;
  const rate = rates.usdToAmd ?? fallbackUsdToAmd;
  const date = rates.rateDate
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(`${rates.rateDate}T00:00:00Z`))
    : null;
  // A rate that came from the admin's customs setting has a source/date to show; the fallback is
  // the loan calculator's rate, which has neither, and we say so rather than imply one.
  const rateLine =
    rate === null
      ? null
      : interpolate(t.rateLine, {
          rate: String(rate),
          source:
            rates.usdToAmd !== null ? (rates.rateSource ?? t.sourceUnknown) : t.sourceLoanRate,
          date: rates.usdToAmd !== null && date ? date : t.dateUnknown,
        });

  return (
    <section
      aria-labelledby="customs-result-heading"
      aria-live="polite"
      className="flex flex-col gap-5 rounded-[20px] bg-white p-6 text-neutral-700 lg:p-9"
    >
      <h3
        id="customs-result-heading"
        className="stretch-90 text-[20px] font-bold leading-8 text-neutral-900"
      >
        {t.heading}
      </h3>

      {result.status === 'ok' ? (
        <>
          <dl className="flex flex-col gap-2 text-[14px] leading-6">
            <Row
              label={t.customsValue}
              formula={interpolate(t.customsValueFormula, {
                usd: formatUsd(result.breakdown.customsValueUsd),
                rate: String(result.breakdown.usdToAmd),
              })}
              value={formatAmd(result.breakdown.customsValueAmd)}
            />
            <Row
              label={t.duty}
              formula={
                result.breakdown.exempt
                  ? t.exemptNote
                  : interpolate(t.dutyFormula, { percent: String(result.breakdown.dutyPercent) })
              }
              value={formatAmd(result.breakdown.dutyAmd)}
            />
            <Row
              label={t.excise}
              formula={
                result.breakdown.exempt
                  ? t.exemptNote
                  : interpolate(t.exciseFormula, {
                      volume: String(result.breakdown.engineVolumeCm3),
                      rate: String(result.breakdown.exciseAmdPerCm3),
                    })
              }
              value={formatAmd(result.breakdown.exciseAmd)}
            />
            <Row
              label={t.vat}
              formula={interpolate(t.vatFormula, { percent: String(result.breakdown.vatPercent) })}
              value={formatAmd(result.breakdown.vatAmd)}
            />
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-neutral-100 pt-4">
              <dt className="text-[16px] font-bold text-neutral-900">{t.total}</dt>
              <dd className="text-[24px] font-bold tabular-nums text-neutral-900">
                {formatAmd(result.breakdown.totalAmd)}
              </dd>
            </div>
          </dl>
          <p className="text-[12px] leading-4">{t.formula}</p>
        </>
      ) : (
        <>
          <p className="text-[14px] leading-6">{t.ratesMissing}</p>
          <p className="text-[14px] leading-6 tabular-nums">
            {interpolate(t.customsValueFormulaShort, { usd: formatUsd(result.customsValueUsd) })}
          </p>
        </>
      )}

      {rateLine && <p className="text-[12px] leading-4">{rateLine}</p>}
      <p className="text-[12px] leading-4">{t.disclaimer}</p>

      <button
        type="button"
        onClick={onAsk}
        className="inline-flex h-12 w-fit items-center justify-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {t.cta}
      </button>
    </section>
  );
}

function Row({ label, formula, value }: { label: string; formula: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
      <div className="min-w-0">
        <dt className="font-bold text-neutral-800">{label}</dt>
        <dd className="text-[12px] leading-4 tabular-nums">{formula}</dd>
      </div>
      <dd className="font-bold tabular-nums text-neutral-900">{value}</dd>
    </div>
  );
}
