'use client';

import type { Car } from '@/lib/types/car';
import { interpolate } from '@/lib/messages';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * China (and later USA) car-detail S3.4 — "Ընդհանուր տվյալներ" spec table.
 * Every row maps to a real `Car` column (`apps/api/prisma/schema.prisma`);
 * rows whose value is null/absent for this car are skipped rather than shown
 * empty, since not every spec applies to every powertrain (an EV has no
 * `transmission`, a benzin car has no `range`/`battery`). A client component
 * (not a Server Component) because `CarDetailHero.tsx` — a client component —
 * renders it inline; a Client Component may only import Server Components
 * that are handed to it via composition, never imported and instantiated
 * directly. Each row is its own white card (Figma node 102:510) — not a
 * divided list — so it reads against the section's off-white backdrop the
 * same way every other row-card on this page does.
 */
export function CarSpecs({ car }: { car: Car }) {
  const messages = useMessages();
  const t = messages.china.detail.specs;
  const conditionLabels = messages.china.carCard.conditions;

  const rows: { label: string; value: string }[] = [
    { label: t.make, value: car.make },
    { label: t.condition, value: conditionLabels[car.condition] },
    car.deliveryEtaDays
      ? {
          label: t.deliveryEta,
          value: interpolate(t.deliveryEtaValue, { days: String(car.deliveryEtaDays) }),
        }
      : null,
    { label: t.year, value: String(car.year) },
    car.trim ? { label: t.trim, value: car.trim } : null,
    { label: t.fuel, value: t.powertrain[car.powertrain] },
    car.range
      ? {
          label: t.range,
          value: interpolate(t.rangeValue, { km: car.range.toLocaleString('en-US') }),
        }
      : null,
    car.battery ? { label: t.battery, value: car.battery } : null,
    car.engine ? { label: t.engine, value: car.engine } : null,
    car.drivetrain ? { label: t.drivetrain, value: car.drivetrain } : null,
    car.seats ? { label: t.seats, value: String(car.seats) } : null,
    car.warranty ? { label: t.warranty, value: car.warranty } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-[20px] font-bold leading-[32px] text-neutral-800">
        {t.heading}
      </h2>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 rounded-md bg-white p-3"
          >
            <span className="w-[221px] shrink-0 text-[16px] leading-[24px] text-neutral-700">
              {row.label}
            </span>
            <span className="flex-1 text-right text-[16px] font-medium leading-[20px] text-neutral-800">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
