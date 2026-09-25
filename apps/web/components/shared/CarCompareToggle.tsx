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
 * Sits inside `CarCard`'s own `<Link>`, so a click has to stop the
 * navigation it would otherwise trigger.
 */
export function CarCompareToggle({
  car,
  label,
  labelSelected,
}: {
  car: CompareCarRef;
  label: string;
  labelSelected: string;
}) {
  const { isSelected, toggle } = useCompare();
  const selected = isSelected(car.id);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(car);
      }}
      className={`rounded-pill border px-[16px] py-[10px] text-[16px] font-medium leading-[20px] transition-colors duration-standard ${
        selected
          ? 'border-accent bg-accent text-ink'
          : 'border-white bg-transparent text-white hover:bg-white/10'
      }`}
    >
      ⚖ {selected ? labelSelected : label}
    </button>
  );
}
