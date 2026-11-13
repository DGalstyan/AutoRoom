'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { interpolate } from '@/lib/messages';
import { useMessages } from '@/components/shared/LocaleProvider';
import { DROPDOWN_OPTION, DROPDOWN_PANEL, DropdownCaret } from '@/components/ui/ListboxSelect';
import { searchCarsToCompare, type CompareSearchResult } from '@/lib/actions/compare';

/**
 * The empty state of `/compare` (Figma 495:14967): two white car cards with a ⚡ between them and a
 * gold «Համեմատել» button under. Each card opens a search dropdown to choose its car; the button
 * goes to `/compare?a=…&b=…` once both are chosen.
 */
export function ComparePicker({
  initialA,
  initialB,
}: {
  initialA: CompareSearchResult | null;
  initialB: CompareSearchResult | null;
}) {
  const t = useMessages().common.compare;
  const router = useRouter();
  const [slots, setSlots] = useState<[CompareSearchResult | null, CompareSearchResult | null]>([
    initialA,
    initialB,
  ]);
  const ready = slots[0] && slots[1];

  function setSlot(index: 0 | 1, car: CompareSearchResult) {
    setSlots((current) => (index === 0 ? [car, current[1]] : [current[0], car]));
  }

  function go() {
    if (!slots[0] || !slots[1]) return;
    router.push(
      `/compare?a=${encodeURIComponent(slots[0].slug)}&b=${encodeURIComponent(slots[1].slug)}`,
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="grid w-full grid-cols-1 items-stretch gap-3 sm:flex sm:items-center sm:gap-16">
        <PickerCard
          car={slots[0]}
          exclude={slots[1]?.id}
          onPick={(car) => setSlot(0, car)}
          label={t.page.pickCar}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="hidden size-[60px] shrink-0 text-accent sm:block"
          aria-hidden="true"
        >
          <path
            d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <PickerCard
          car={slots[1]}
          exclude={slots[0]?.id}
          onPick={(car) => setSlot(1, car)}
          label={t.page.pickCar}
        />
      </div>
      <button
        type="button"
        disabled={!ready}
        onClick={go}
        className="inline-flex h-[60px] items-center justify-center rounded-pill bg-accent px-6 text-[16px] font-bold leading-6 text-ink transition-colors duration-standard hover:bg-accent-600 disabled:pointer-events-none disabled:opacity-50"
      >
        {t.page.compareCta}
      </button>
    </div>
  );
}

function PickerCard({
  car,
  exclude,
  onPick,
  label,
}: {
  car: CompareSearchResult | null;
  exclude?: string;
  onPick: (car: CompareSearchResult) => void;
  label: string;
}) {
  const t = useMessages().common.compare;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompareSearchResult[] | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchCarsToCompare(query, exclude).then((found) => {
        if (!cancelled) setResults(found);
      });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, exclude]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 flex-1"
      onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          car ? interpolate(t.page.changeCar, { name: `${car.make} ${car.model}` }) : label
        }
        onClick={() => setOpen((current) => !current)}
        className="flex w-full flex-col gap-3 rounded-[24px] bg-white p-3 text-left sm:flex-row sm:items-center sm:gap-6"
      >
        {car?.imageUrl ? (
          <Image
            src={car.imageUrl}
            alt=""
            width={305}
            height={172}
            className="aspect-[305/172] h-auto w-full shrink-0 rounded-[14px] object-cover sm:h-[171.594px] sm:w-[305.057px] sm:rounded-[19.449px]"
          />
        ) : (
          <div
            className="aspect-[305/172] w-full shrink-0 rounded-[14px] bg-neutral-25 sm:h-[171.594px] sm:w-[305.057px] sm:rounded-[19.449px]"
            aria-hidden="true"
          />
        )}
        <span className="flex flex-1 items-center justify-between gap-1 px-1 pb-1 sm:px-0 sm:pb-0">
          <span className="text-neutral-800">
            {car ? (
              <>
                <span className="block text-[18px] font-bold leading-6 sm:text-[24px] sm:leading-9">
                  {car.make}
                </span>
                <span className="block text-[14px] font-medium leading-5 sm:text-[16px]">
                  {car.model}
                </span>
              </>
            ) : (
              <span className="block text-[16px] font-medium leading-5 text-neutral-600">
                {label}
              </span>
            )}
          </span>
          <svg
            width="28"
            height="28"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className={`shrink-0 text-neutral-800 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className={`${DROPDOWN_PANEL} !left-6 !right-6 sm:!left-[329px]`}>
          <DropdownCaret />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.modal.searchPlaceholder}
            aria-label={t.modal.searchLabel}
            autoFocus
            autoComplete="off"
            className="my-1 h-10 w-full rounded-pill bg-neutral-25 px-4 text-[14px] text-ink outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-accent"
          />
          <ul role="listbox" aria-label={t.modal.searchLabel} className="max-h-64 overflow-y-auto">
            {results && results.length === 0 ? (
              <li className="py-2.5 pl-2 text-[12px] text-[#999ea1]">{t.modal.noResults}</li>
            ) : (
              (results ?? []).map((result) => (
                <li key={result.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={car?.id === result.id}
                    onClick={() => {
                      onPick(result);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={DROPDOWN_OPTION}
                  >
                    {result.make} {result.model} {result.year}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
