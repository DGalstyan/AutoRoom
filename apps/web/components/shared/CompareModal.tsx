'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { interpolate } from '@/lib/messages';
import { Dialog } from '@/components/ui/Dialog';
import { useCompare } from '@/components/shared/CompareProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import { searchCarsToCompare, type CompareSearchResult } from '@/lib/actions/compare';

/**
 * "Համեմատել այլ մոդելի հետ" (Figma node `378:7860`, file
 * `9Lq4XpWusTJj1VnM6laAZr`) — the picker that turns 1 selected car into the
 * 2 `/compare` needs. Mounted once alongside `CompareProvider`, same as
 * every other popup in this app (`LeadWidgetProvider`'s own doc comment).
 *
 * The mock shows one static search field with a value already in it; there
 * is no way to tell from a static frame whether it opens a live results
 * list, but "Որոնում" (Search) as its own label only makes sense with one,
 * so this debounces the search action as the visitor types rather than
 * waiting for a submit that isn't in the mock either.
 */
export function CompareModal() {
  const { cars, toggle, remove, isPickerOpen, closePicker } = useCompare();
  const t = useMessages().common.compare.modal;
  const closeLabel = useMessages().common.popup.close;
  const router = useRouter();
  const titleId = useId();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompareSearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const excludeId = cars[0]?.id;

  useEffect(() => {
    if (!isPickerOpen) {
      queueMicrotask(() => {
        setQuery('');
        setResults([]);
      });
    }
  }, [isPickerOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || cars.length >= 2) {
      queueMicrotask(() => setResults([]));
      return;
    }
    debounceRef.current = setTimeout(() => {
      void searchCarsToCompare(query, excludeId).then(setResults);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, excludeId, cars.length]);

  /** Adds the picked result to the shared `cars` list (not just local search
   * state) — this is what the compare bar and `/compare` link both read, so
   * picking a car here has to be the same "add" `CarCard`'s own toggle does. */
  function pick(result: CompareSearchResult) {
    toggle({
      id: result.id,
      slug: result.slug,
      make: result.make,
      model: result.model,
      year: result.year,
      imageUrl: result.imageUrl,
      origin: result.origin,
      condition: result.condition,
    });
    setQuery('');
    setResults([]);
  }

  function confirm() {
    if (cars.length < 2) return;
    closePicker();
    router.push(
      `/compare?a=${encodeURIComponent(cars[0]!.slug)}&b=${encodeURIComponent(cars[1]!.slug)}`,
    );
  }

  const canConfirm = cars.length === 2;

  return (
    <Dialog open={isPickerOpen} onClose={closePicker} titleId={titleId} closeLabel={closeLabel}>
      <h2 id={titleId} className="font-display text-h3 font-bold text-ink">
        {t.heading}
      </h2>

      <div className="mt-6 flex flex-col gap-3">
        {cars.map((car) => (
          <div
            key={car.id}
            className="flex items-center gap-4 rounded-[24px] bg-neutral-25 p-3 sm:gap-6"
          >
            {car.imageUrl ? (
              <Image
                src={car.imageUrl}
                alt=""
                width={188}
                height={106}
                className="h-[64px] w-[114px] shrink-0 rounded-[12px] object-cover sm:h-[106px] sm:w-[188px]"
              />
            ) : (
              <div
                className="h-[64px] w-[114px] shrink-0 rounded-[12px] bg-neutral-100 sm:h-[106px] sm:w-[188px]"
                aria-hidden
              />
            )}
            <div className="flex-1 text-ink">
              <p className="text-[16px] font-bold leading-5">{car.make}</p>
              <p className="text-[12px] font-medium leading-4 text-neutral-700">{car.model}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(car.id)}
              aria-label={interpolate(t.changeCar, { name: `${car.make} ${car.model}` })}
              className="flex size-11 shrink-0 items-center justify-center text-neutral-700 hover:text-ink"
            >
              <ChevronGlyph />
            </button>
          </div>
        ))}

        {cars.length < 2 && (
          <div className="flex flex-col gap-2">
            <label htmlFor="compare-search" className="text-[16px] font-medium text-neutral-700">
              {t.searchLabel}
            </label>
            <div>
              <input
                id="compare-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                autoComplete="off"
                className="h-[72px] w-full rounded-[50px] bg-neutral-25 px-6 text-[16px] text-neutral-800 outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-accent"
              />
              {query.trim() && (
                /* In the flow, not floating: the dialog scrolls, so an absolutely positioned
                  list hung below the field was clipped by the panel and, on its white
                  background with a faint shadow, read as missing. */
                <div
                  role="listbox"
                  aria-label={t.searchLabel}
                  className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-line-light bg-white p-2"
                >
                  {results.length === 0 ? (
                    <p className="p-3 text-[14px] text-neutral-700">{t.noResults}</p>
                  ) : (
                    results.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        role="option"
                        aria-selected="false"
                        onClick={() => pick(result)}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-neutral-25"
                      >
                        {result.imageUrl ? (
                          <Image
                            src={result.imageUrl}
                            alt=""
                            width={48}
                            height={32}
                            className="h-8 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-12 rounded bg-neutral-100" aria-hidden />
                        )}
                        <span className="text-[14px] text-ink">
                          {result.make} {result.model} {result.year}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-9 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={closePicker}
          className="h-12 rounded-pill bg-neutral-100 px-6 text-[14px] font-bold text-ink"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={confirm}
          className="h-12 rounded-pill bg-accent px-6 text-[14px] font-bold text-ink disabled:pointer-events-none disabled:opacity-50"
        >
          {t.confirm}
        </button>
      </div>
    </Dialog>
  );
}

function ChevronGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
