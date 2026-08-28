import type { Car } from '@/lib/types/car';
import { interpolate, messages } from '@/lib/messages';

const t = messages.china.detail.specs;
const conditionLabels = messages.china.carCard.conditions;

/**
 * China (and later USA) car-detail S3.4 — "Ընդհանուր տվյալներ" spec table.
 * Every row maps to a real `Car` column (`apps/api/prisma/schema.prisma`);
 * rows whose value is null/absent for this car are skipped rather than shown
 * empty, since not every spec applies to every powertrain (an EV has no
 * `transmission`, a benzin car has no `range`/`battery`). No hooks — safe to
 * render from a Server Component.
 */
export function CarSpecs({ car }: { car: Car }) {
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
    <div>
      <h2 className="font-display text-[24px] font-semibold leading-[32px] text-ink">
        {t.heading}
      </h2>
      <div className="mt-3 flex flex-col divide-y divide-line-light">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3">
            <span className="text-[16px] text-muted">{row.label}</span>
            <span className="text-right text-[14px] font-medium text-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
