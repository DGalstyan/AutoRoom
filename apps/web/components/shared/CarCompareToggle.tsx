'use client';

import { useCompare, type CompareCarRef } from '@/components/shared/CompareProvider';

/**
 * The `⚖ Համեմատել` toggle `references/components.md`'s `CarCard` entry
 * calls for. Pulled out as its own small client component rather than making
 * `CarCard` itself `'use client'`: that card is an `async` Server Component
 * (it awaits `getServerMessages()`), and only this one checkbox needs
 * `useCompare()` — same reasoning `PromoCountdown` is a separate client
 * child inside it.
 *
 * Sits beside `CarCard`'s stretched link (never inside it), above it in the stacking order.
 */
export function CarCompareToggle({
  car,
  label,
  labelSelected,
  className = '',
  compact = false,
}: {
  car: CompareCarRef;
  label: string;
  labelSelected: string;
  className?: string;
  /** Icon only (the label stays for screen readers) — for card rows too crowded for the full chip. */
  compact?: boolean;
}) {
  const { isSelected, toggle } = useCompare();
  const selected = isSelected(car.id);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => toggle(car)}
      className={`${className} min-h-11 rounded-pill border px-[16px] py-[10px] text-[16px] font-medium leading-[20px] transition-colors duration-standard max-sm:px-3 max-sm:py-2 max-sm:text-[14px] ${
        selected
          ? 'border-accent bg-accent text-ink'
          : 'border-white bg-transparent text-white hover:bg-white/10'
      }`}
    >
      <span aria-hidden="true">⚖</span>{' '}
      <span className={compact ? 'sr-only' : ''}>{selected ? labelSelected : label}</span>
    </button>
  );
}
