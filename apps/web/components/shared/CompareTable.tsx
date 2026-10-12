'use client';

import Image from 'next/image';
import type { Car, FinanceCalculator } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';
import { Reveal } from '@/components/ui/Reveal';
import { computeMonthlyPaymentAmd } from '@/lib/loan';
import { useCompare, type CompareCarRef } from '@/components/shared/CompareProvider';
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
  const { changeOther } = useCompare();
  const t = useMessages().common.compare.page;
  const specsT = useMessages().common.carDetail.specs;

  const monthlyA = monthlyPayment(carA, finance);
  const monthlyB = monthlyPayment(carB, finance);

  const specRows = buildSpecRows(carA, carB, specsT);

  return (
    <div className="flex w-full flex-col gap-12">
      <Reveal delayMs={80}>
        <div className="grid grid-cols-2 items-stretch gap-3 sm:flex sm:items-center sm:gap-16">
          <CarHeaderCard car={carA} onChange={() => changeOther(toRef(carB))} />
          <BoltGlyph className="hidden size-[60px] shrink-0 text-accent sm:block" />
          <CarHeaderCard car={carB} onChange={() => changeOther(toRef(carA))} />
        </div>
      </Reveal>

      <div className="flex w-full flex-col gap-2">
        <CompareSection heading={t.priceHeading}>
          <CompareRow
            label={t.priceFinal}
            valueA={formatUsd(carA.estFinalPriceAM ?? carA.price)}
            valueB={formatUsd(carB.estFinalPriceAM ?? carB.price)}
          />
          <CompareRow
            label={t.priceMonthly}
            valueA={formatUsd(Math.round(monthlyA / finance.usdToAmd))}
            valueB={formatUsd(Math.round(monthlyB / finance.usdToAmd))}
          />
        </CompareSection>

        <CompareSection heading={t.generalHeading}>
          <CompareRow label={specsT.model} valueA={carA.model} valueB={carB.model} />
          <CompareRow label={specsT.year} valueA={String(carA.year)} valueB={String(carB.year)} />
        </CompareSection>

        {specRows.length > 0 && (
          <CompareSection heading={t.specsHeading}>
            {specRows.map((row) => (
              <CompareRow
                key={row.label}
                label={row.label}
                valueA={row.valueA}
                valueB={row.valueB}
              />
            ))}
          </CompareSection>
        )}
      </div>
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
    <Reveal className="flex w-full flex-col gap-2">
      <h2 className="font-display text-[24px] font-bold leading-9 text-neutral-800">{heading}</h2>
      {children}
    </Reveal>
  );
}

function CompareRow({ label, valueA, valueB }: { label: string; valueA: string; valueB: string }) {
  const differs = valueA !== valueB;
  // Figma 448:13725: 150px values (16px Medium) either side of a 351px label, every price in $.
  const value =
    'min-w-0 text-center text-[16px] font-medium leading-5 tabular-nums text-neutral-800 sm:w-[150px] sm:shrink-0';
  return (
    <div className="grid w-full grid-cols-2 items-center gap-x-3 gap-y-1 rounded-md bg-white p-3 transition-shadow duration-standard ease-expo hover:shadow-[0_4px_16px_rgba(13,13,13,0.06)] sm:flex sm:justify-center sm:gap-12">
      <span className={value}>{valueA}</span>
      <span
        className={`col-span-2 text-center text-[16px] font-bold leading-6 max-sm:order-first sm:w-[351px] sm:shrink-0 sm:text-[20px] sm:leading-8 ${
          differs ? 'text-error' : 'text-ink'
        }`}
      >
        {label}
      </span>
      <span className={value}>{valueB}</span>
    </div>
  );
}

function toRef(car: Car): CompareCarRef {
  return {
    id: car.id,
    slug: car.slug,
    make: car.make,
    model: car.model,
    year: car.year,
    imageUrl: car.images[0]?.thumbnailUrl ?? car.images[0]?.url,
    origin: car.origin,
    condition: car.condition,
  };
}

function CarHeaderCard({ car, onChange }: { car: Car; onChange: () => void }) {
  const changeLabel = useMessages().common.compare.page.changeCar;
  const image = car.images[0]?.thumbnailUrl ?? car.images[0]?.url;
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-[24px] bg-white p-3 sm:flex-row sm:items-center sm:gap-6">
      {image ? (
        <Image
          src={image}
          alt=""
          width={305}
          height={172}
          className="aspect-[305/172] h-auto w-full shrink-0 rounded-[14px] object-cover sm:h-[171.594px] sm:w-[305.057px] sm:rounded-[19.449px]"
        />
      ) : (
        <div className="aspect-[305/172] w-full shrink-0 rounded-[14px] bg-neutral-100 sm:h-[171.594px] sm:w-[305.057px] sm:rounded-[19.449px]" />
      )}
      <div className="flex flex-1 items-center justify-between gap-1 px-1 pb-1 sm:px-0 sm:pb-0">
        <div className="text-neutral-800">
          <p className="text-[18px] font-bold leading-6 sm:text-[24px] sm:leading-9">{car.make}</p>
          <p className="text-[14px] font-medium leading-5 sm:text-[16px]">{car.model}</p>
        </div>
        <button
          type="button"
          onClick={onChange}
          aria-label={interpolate(changeLabel, { name: `${car.make} ${car.model}` })}
          className="flex size-11 shrink-0 items-center justify-center text-neutral-800 transition-transform duration-standard ease-expo hover:translate-y-0.5 hover:text-ink"
        >
          <ChevronGlyph />
        </button>
      </div>
    </div>
  );
}

function ChevronGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
