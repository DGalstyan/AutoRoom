'use client';

import { Button, Dialog } from '@/components/ui';
import { CarImage } from '@/components/shared/CarImage';
import { COMPARE_LIMIT, useCompare } from '@/components/compare/CompareProvider';
import { useLeadWidget } from '@/components/lead/LeadWidgetProvider';
import { CARS } from '@/data/cars';
import { DEFAULT_LOAN_CONFIG, calculateMonthly, usdToAmd } from '@/lib/loan';
import { formatAmd, formatUsd } from '@/lib/format';
import { t, tf, type MessageKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { SPEC_ROWS, carHref, carName, type Car } from '@/types/car';

/**
 * Side-by-side comparison of 2–3 cars, entered from the "⚖ Համեմատել" toggle on
 * `CarCard` or "Համեմատիր այս մեքենան" on `CarDetail`.
 *
 * Mounted once in the root layout: the dock has to survive navigation between a
 * list and a detail page while the user assembles a selection.
 *
 * Rows where the cars actually differ are highlighted — that difference is the
 * only reason to open the table at all.
 *
 * TODO(spec): the detailed matching logic (which rows to surface for mixed
 * variants, how to rank near-equal values) is still open. v1 shows price,
 * financing and the spec rows of the first selected car's variant.
 */

export function CompareTool() {
  const { slugs, remove, clear, open, setOpen } = useCompare();
  const { isOpen: leadOpen } = useLeadWidget();

  const cars = slugs
    .map((slug) => CARS.find((car) => car.slug === slug))
    .filter((car): car is Car => Boolean(car));

  if (cars.length === 0) return null;

  return (
    <>
      {/* Dock. Sits above the global sticky CTA on mobile and to its left on
          desktop, and hides while a lead popup is open — same rule as StickyCta. */}
      <div
        aria-hidden={leadOpen}
        className={cn(
          'fixed inset-x-0 bottom-20 z-30 px-gutter-sm transition-opacity duration-standard ease-expo',
          'lg:inset-x-auto lg:bottom-6 lg:left-6 lg:px-0',
          leadOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
      >
        <div className="flex items-center gap-3 rounded-pill border border-line-light bg-paper px-4 py-3 shadow-card">
          <span className="text-small font-medium">
            {tf('compare.selected', { count: `${cars.length}/${COMPARE_LIMIT}` })}
          </span>
          <Button size="sm" onClick={() => setOpen(true)} disabled={cars.length < 2}>
            {t('compare.open')}
          </Button>
          <button
            type="button"
            onClick={clear}
            className="text-caption text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            {t('compare.clear')}
          </button>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={t('compare.title')} size="xl">
        {cars.length < 2 ? (
          <p className="text-body text-muted">{t('compare.empty')}</p>
        ) : (
          <ComparisonTable cars={cars} onRemove={remove} />
        )}
      </Dialog>
    </>
  );
}

interface Row {
  key: string;
  label: string;
  values: string[];
}

function ComparisonTable({ cars, onRemove }: { cars: Car[]; onRemove: (slug: string) => void }) {
  const rows = buildRows(cars);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-small">
        <caption className="sr-only">{t('compare.title')}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-40" />
            {cars.map((car) => (
              <th key={car.slug} scope="col" className="p-3 align-top">
                <div className="flex flex-col gap-2">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-surface-light">
                    <CarImage src={car.images.exterior[0]} alt={carName(car)} />
                  </div>
                  <a href={carHref(car)} className="font-semibold hover:text-accent">
                    {carName(car)}
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemove(car.slug)}
                    className="self-start text-caption text-muted underline-offset-2 hover:text-accent hover:underline"
                  >
                    {t('compare.remove')}
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-light">
          {rows.map((row) => {
            const differs = new Set(row.values).size > 1;
            return (
              <tr key={row.key} className={cn(differs && 'bg-accent/5')}>
                <th scope="row" className="p-3 text-left font-normal text-muted">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td
                    key={`${row.key}-${cars[index].slug}`}
                    className={cn('p-3 tabular-nums', differs && 'font-semibold text-ink')}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const EMPTY = '—';

function buildRows(cars: Car[]): Row[] {
  const rows: Row[] = [
    {
      key: 'price',
      label: t('compare.price'),
      values: cars.map((car) => formatUsd(car.price)),
    },
    {
      key: 'final',
      label: t('car.estimatedFinalPrice'),
      values: cars.map((car) =>
        car.estimatedFinalPrice ? formatUsd(car.estimatedFinalPrice) : EMPTY,
      ),
    },
    {
      key: 'monthly',
      label: t('compare.monthlyPayment'),
      values: cars.map((car) => {
        const priceAmd = usdToAmd(car.estimatedFinalPrice ?? car.price);
        const down = priceAmd * DEFAULT_LOAN_CONFIG.defaultDownPaymentRatio;
        return formatAmd(calculateMonthly(priceAmd, down));
      }),
    },
  ];

  // Spec rows follow the first car's variant; comparing a China car against a
  // USA auction lot is allowed but only the shared fields will have values.
  for (const { field, labelKey } of SPEC_ROWS[cars[0].variant]) {
    rows.push({
      key: field,
      label: t(labelKey as MessageKey),
      values: cars.map((car) => {
        const value = car.specs[field];
        return value === undefined || value === '' ? EMPTY : String(value);
      }),
    });
  }

  return rows;
}
