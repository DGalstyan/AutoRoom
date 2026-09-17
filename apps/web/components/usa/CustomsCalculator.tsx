'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

type Powertrain = 'EV' | 'HYBRID' | 'BENZIN';
type Age = 'under3' | 'between3And5' | 'between5And10' | 'over10';
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
 * frame). Figma mocks the 9-field form and a "Հաշվել" button — nothing
 * past that: no result panel, no formula, and `references/pages.md`'s own
 * S2.4 line points at an external site (usamotors.am/am/calculator) as the
 * *inspiration*, not a formula to port. Real Armenian customs duty is
 * tiered by engine volume/age/type and legally binding — not something to
 * approximate client-side from a design mock. So, same pattern as every
 * other "get the exact number" moment on this site (`PriceJourney`'s
 * `ctaLoan`, `CarDetailHero`'s per-car offer): submitting hands the filled
 * fields to a human via the Universal lead popup instead of computing
 * anything.
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
export function CustomsCalculator() {
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

  const powertrainLabels = useMessages().common.carDetail.specs.powertrain;
  const stateLabelByKey = stateLabels as Record<string, string>;
  const stateOptions = useMemo(() => Object.entries(stateLabels), [stateLabels]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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

    openUniversal({
      sourceCta: 'usa-customs-calculator',
      comment: [t.leadCommentHeading, ...lines].join('\n'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t.carValueLabel}>
          <NumberInput value={carValue} onChange={setCarValue} prefix="$" />
        </Field>

        <Field label={t.auctionLabel}>
          <div className="flex h-9 gap-1 rounded-pill bg-neutral-25 p-1">
            {AUCTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAuction(option)}
                className={`flex-1 rounded-pill text-[12px] font-medium transition-colors ${
                  auction === option ? 'bg-neutral-700 text-white' : 'text-neutral-800'
                }`}
              >
                {t.auctionOptions[option]}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t.auctionLocationLabel}>
          <SelectInput
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
        </Field>

        <Field label={t.transportFeeLabel}>
          <NumberInput value={transportFee} onChange={setTransportFee} prefix="$" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={t.engineTypeLabel}>
          <SelectInput value={engineType} onChange={(v) => setEngineType(v as Powertrain)}>
            {POWERTRAINS.map((option) => (
              <option key={option} value={option}>
                {powertrainLabels[option]}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label={t.ageLabel}>
          <SelectInput value={age} onChange={(v) => setAge(v as Age)}>
            {AGES.map((option) => (
              <option key={option} value={option}>
                {t.ageOptions[option]}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label={t.productionYearLabel}>
          <SelectInput value={productionYear} onChange={setProductionYear}>
            {PRODUCTION_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label={t.engineVolumeLabel}>
          <NumberInput value={engineVolume} onChange={setEngineVolume} />
        </Field>

        <Field label={t.vehicleTypeLabel}>
          <SelectInput value={vehicleType} onChange={(v) => setVehicleType(v as VehicleType)}>
            {VEHICLE_TYPES.map((option) => (
              <option key={option} value={option}>
                {t.vehicleTypeOptions[option]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 w-fit shrink-0 items-center justify-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {t.submit}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-medium text-neutral-700">{label}</span>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  prefix,
}: {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
}) {
  return (
    <div className="flex h-9 items-center gap-1 rounded-pill bg-neutral-25 px-3">
      {prefix && <span className="text-[12px] text-neutral-600">{prefix}</span>}
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-[12px] font-medium text-neutral-800 outline-none"
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full appearance-none rounded-pill bg-neutral-25 px-3 text-[12px] font-medium text-neutral-800 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22 fill=%22none%22><path d=%22M4 6l4 4 4-4%22 stroke=%22%23999EA1%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[length:14px] bg-[position:right_12px_center] bg-no-repeat pr-8"
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
