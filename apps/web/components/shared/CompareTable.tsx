'use client';

import Image from 'next/image';
import type { Car, FinanceCalculator } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';
import { computeMonthlyPaymentAmd, formatAmd } from '@/lib/loan';
import { useCompare } from '@/components/shared/CompareProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import { interpolate } from '@/lib/messages';

/**
 * The results table itself (Figma node `378:7909`). Row-by-row, one row per
 * comparable field, the shared center label colored `text-error` whenever
 * the two cars' values for that row differ, plain `text-ink` when they
 * match — verified directly against the mock's own rows: "Model"/"Year"
 * (always different) are red, "Drivetrain"/"Transmission" (same value on
 * both sample cars) are not, so the color follows the values, not the row.
 *
 * The mock repeats its entire 5-row "Տեխնիկական տվյալներ" section a second
 * time under a "Լիցքավորում" (Charging) heading with byte-identical values
 * (same engine/drivetrain/mileage/fuel/transmission numbers both times) —
 * a copy-paste artifact in the Figma file, not a second real section (a
 * charging section would show battery/range, not engine/transmission), so
 * this renders that section once.
 */
export function CompareTable({
  carA,
  carB,
  finance,
}: {
  carA: Car;
  carB: Car;
  finance: FinanceCalculator;
}) {
  const { remove } = useCompare();
  const t = useMessages().common.compare.page;
  const specsT = useMessages().common.carDetail.specs;

  const monthlyA = monthlyPayment(carA, finance);
  const monthlyB = monthlyPayment(carB, finance);

  const specRows = buildSpecRows(carA, carB, specsT);

  return (
    <div className="flex flex-col gap-12 w-full">
      <div className="flex items-center gap-8 sm:gap-16">
        <CarHeaderCard car={carA} onRemove={() => remove(carA.id)} />
        <BoltGlyph className="hidden size-12 shrink-0 text-accent sm:block" />
        <CarHeaderCard car={carB} onRemove={() => remove(carB.id)} />
      </div>

      <CompareSection heading={t.priceHeading}>
        <CompareRow
          label={t.priceFinal}
          valueA={formatUsd(carA.estFinalPriceAM ?? carA.price)}
          valueB={formatUsd(carB.estFinalPriceAM ?? carB.price)}
        />
        <CompareRow
          label={t.priceMonthly}
          valueA={formatAmd(monthlyA)}
          valueB={formatAmd(monthlyB)}
        />
      </CompareSection>

      <CompareSection heading={t.generalHeading}>
        <CompareRow label={specsT.model} valueA={carA.model} valueB={carB.model} />
        <CompareRow label={specsT.year} valueA={String(carA.year)} valueB={String(carB.year)} />
      </CompareSection>

      {specRows.length > 0 && (
        <CompareSection heading={t.specsHeading}>
          {specRows.map((row) => (
            <CompareRow key={row.label} label={row.label} valueA={row.valueA} valueB={row.valueB} />
          ))}
        </CompareSection>
      )}
    </div>
  );
}

function monthlyPayment(car: Car, finance: FinanceCalculator): number {
  const downPayment = Math.round(car.price * finance.defaultDownPaymentRatio);
  return computeMonthlyPaymentAmd(car.price, downPayment, finance);
}

function buildSpecRows(
  carA: Car,
  carB: Car,
  specsT: ReturnType<typeof useMessages>['common']['carDetail']['specs'],
): { label: string; valueA: string; valueB: string }[] {
  const rows: { label: string; valueA: string | null; valueB: string | null }[] = [
    { label: specsT.engine, valueA: carA.engine ?? null, valueB: carB.engine ?? null },
    { label: specsT.drivetrain, valueA: carA.drivetrain ?? null, valueB: carB.drivetrain ?? null },
    {
      label: specsT.mileage,
      valueA: carA.mileage
        ? interpolate(specsT.mileageValue, { km: carA.mileage.toLocaleString('en-US') })
        : null,
      valueB: carB.mileage
        ? interpolate(specsT.mileageValue, { km: carB.mileage.toLocaleString('en-US') })
        : null,
    },
    {
      label: specsT.fuel,
      valueA: specsT.powertrain[carA.powertrain],
      valueB: specsT.powertrain[carB.powertrain],
    },
    {
      label: specsT.transmission,
      valueA: carA.transmission ?? null,
      valueB: carB.transmission ?? null,
    },
  ];

  return rows.filter(
    (row): row is { label: string; valueA: string; valueB: string } =>
      row.valueA !== null && row.valueB !== null,
  );
}

function CompareSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="font-display text-h3 font-bold text-neutral-800">{heading}</h2>
      {children}
    </div>
  );
}

function CompareRow({ label, valueA, valueB }: { label: string; valueA: string; valueB: string }) {
  const differs = valueA !== valueB;
  return (
    <div className="flex w-full items-center justify-center gap-6 rounded-xl bg-white p-3 sm:gap-12">
      <span className="w-[150px] shrink-0 text-[16px] font-medium text-neutral-700">{valueA}</span>
      <span
        className={`w-[351px] shrink-0 text-center text-[20px] font-bold leading-8 ${
          differs ? 'text-error' : 'text-ink'
        }`}
      >
        {label}
      </span>
      <span className="w-[150px] shrink-0 text-[16px] font-medium text-neutral-700">{valueB}</span>
    </div>
  );
}

function CarHeaderCard({ car, onRemove }: { car: Car; onRemove: () => void }) {
  const image = car.images[0]?.url;
  return (
    <div className="flex flex-1 items-center gap-6 rounded-2xl bg-white p-3">
      {image ? (
        <Image
          src={image}
          alt=""
          width={305}
          height={172}
          className="h-[86px] w-[152px] shrink-0 rounded-2xl object-cover sm:h-[172px] sm:w-[305px]"
        />
      ) : (
        <div className="h-[86px] w-[152px] shrink-0 rounded-2xl bg-neutral-100 sm:h-[172px] sm:w-[305px]" />
      )}
      <div className="flex flex-1 items-center justify-between">
        <div className="text-neutral-800">
          <p className="text-[24px] font-bold leading-9">{car.make}</p>
          <p className="text-[16px] font-medium leading-5">{car.model}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={car.make}
          className="flex size-7 shrink-0 items-center justify-center text-neutral-500 hover:text-ink"
        >
          <XGlyph />
        </button>
      </div>
    </div>
  );
}

function XGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 4L16 16M16 4L4 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BoltGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
