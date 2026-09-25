'use client';

import Image from 'next/image';
import { useCompare } from '@/components/shared/CompareProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import { interpolate } from '@/lib/messages';

/**
 * Floating summary bar for the `⚖ Համեմատել` toggle on `CarCard` — not
 * itself in the Figma mock (that only shows the modal opened from a car
 * detail page), but the second entry point `references/components.md`'s
 * `CompareTool` line calls for needs *some* way back to the compare flow
 * after leaving the listing page, and a persistent bar is the standard
 * pattern for this across car-marketplace sites generally.
 */
export function CompareBar() {
  const { cars, remove, openPicker } = useCompare();
  const t = useMessages().common.compare.bar;

  if (cars.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="flex items-center gap-4 rounded-pill bg-ink px-4 py-2 shadow-card sm:px-6">
        <div className="flex items-center -space-x-3">
          {cars.map((car) => (
            <div
              key={car.id}
              className="relative size-10 overflow-hidden rounded-pill border-2 border-ink bg-neutral-700"
            >
              {car.imageUrl && <Image src={car.imageUrl} alt="" fill className="object-cover" />}
            </div>
          ))}
        </div>

        <span className="hidden text-[14px] font-medium text-white sm:inline">
          {interpolate(t.heading, { count: String(cars.length) })}
        </span>

        <button
          type="button"
          onClick={() => cars.forEach((car) => remove(car.id))}
          className="text-[14px] font-medium text-white/60 transition-colors hover:text-white"
        >
          {t.clear}
        </button>

        <button
          type="button"
          onClick={() => openPicker()}
          className="h-11 rounded-pill bg-accent px-5 text-[14px] font-bold text-ink transition-colors hover:bg-accent-600"
        >
          {t.cta}
        </button>
      </div>
    </div>
  );
}
