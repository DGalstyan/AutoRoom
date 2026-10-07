'use client';

import { useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMessages } from '@/components/shared/LocaleProvider';
import { interpolate } from '@/lib/messages';
import { ListDropdown, PriceDropdown } from '@/components/china/FilterDropdowns';

const PRICE_MIN = 1_000;
const PRICE_MAX = 500_000;

/**
 * China page S1 — condition tabs + Make/Model/price-range filters. A client
 * component that only ever edits the URL's `searchParams`; the actual
 * fetch stays server-side in `app/china/page.tsx`; changing a filter is a
 * normal navigation, not a second browser-reachable API call. Pixel-matched
 * to Figma node 101:222.
 *
 * `makeModels` is the real make→model facet set for CHINA-origin cars,
 * computed server-side from what is actually published — an admin adding a
 * new make shows up here with no code change.
 */
export function ChinaFilters({
  makeModels,
  total,
}: {
  makeModels: Record<string, string[]>;
  total: number;
}) {
  const t = useMessages().china.filters;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const condition = searchParams.get('condition') ?? '';
  const make = searchParams.get('make') ?? '';
  const model = searchParams.get('model') ?? '';

  const query = searchParams.get('q') ?? '';
  const urlPriceMin = Number(searchParams.get('priceMin') ?? PRICE_MIN);
  const urlPriceMax = Number(searchParams.get('priceMax') ?? PRICE_MAX);
  const [draft, setDraft] = useState(query);
  const [priceMin, setPriceMin] = useState(urlPriceMin);
  const [priceMax, setPriceMax] = useState(urlPriceMax);
  // Back/forward and chip removals change the URL; re-sync the local inputs
  // to it (the "adjust state while rendering" pattern, not an effect).
  const [seenUrl, setSeenUrl] = useState(`${query}|${urlPriceMin}|${urlPriceMax}`);
  const currentUrl = `${query}|${urlPriceMin}|${urlPriceMax}`;
  if (seenUrl !== currentUrl) {
    setSeenUrl(currentUrl);
    setDraft(query);
    setPriceMin(urlPriceMin);
    setPriceMax(urlPriceMax);
  }

  const makes = Object.keys(makeModels).sort((a, b) => a.localeCompare(b));
  const models = (make ? (makeModels[make] ?? []) : Object.values(makeModels).flat())
    .slice()
    .sort((a, b) => a.localeCompare(b));

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
  }

  function commitPrice(nextMin: number, nextMax: number) {
    updateParams({
      priceMin: nextMin > PRICE_MIN ? String(nextMin) : null,
      priceMax: nextMax < PRICE_MAX ? String(nextMax) : null,
    });
  }

  const priceActive = priceMin > PRICE_MIN || priceMax < PRICE_MAX;
  const conditionLabel =
    condition === 'ON_ORDER' ? t.tabOnOrder : condition === 'IN_STOCK' ? t.tabInStock : '';

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (query) {
    chips.push({
      key: 'q',
      label: interpolate(t.chipSearch, { value: query }),
      clear: () => updateParams({ q: null }),
    });
  }
  if (conditionLabel) {
    chips.push({
      key: 'condition',
      label: conditionLabel,
      clear: () => updateParams({ condition: null }),
    });
  }
  if (make) {
    chips.push({
      key: 'make',
      label: `${t.makePrefix}: ${make}`,
      clear: () => updateParams({ make: null, model: null }),
    });
  }
  if (model) {
    chips.push({
      key: 'model',
      label: `${t.model}: ${model}`,
      clear: () => updateParams({ model: null }),
    });
  }
  if (priceActive) {
    chips.push({
      key: 'price',
      label: interpolate(t.chipPrice, {
        from: priceMin.toLocaleString('en-US'),
        to: priceMax.toLocaleString('en-US'),
      }),
      clear: () => {
        setPriceMin(PRICE_MIN);
        setPriceMax(PRICE_MAX);
        updateParams({ priceMin: null, priceMax: null });
      },
    });
  }

  function resetAll() {
    setPriceMin(PRICE_MIN);
    setPriceMax(PRICE_MAX);
    setDraft('');
    router.push(pathname, { scroll: false });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    updateParams({ q: draft.trim() || null });
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 rounded-[32px] bg-white px-6 py-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6 xl:rounded-[70px]">
        <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-[24px] bg-neutral-25 px-4 py-3 sm:w-fit sm:flex-nowrap sm:rounded-pill">
          <TabButton active={condition === ''} onClick={() => updateParams({ condition: null })}>
            {t.tabAll}
          </TabButton>
          <TabButton
            active={condition === 'ON_ORDER'}
            onClick={() => updateParams({ condition: 'ON_ORDER' })}
          >
            {t.tabOnOrder}
          </TabButton>
          <TabButton
            active={condition === 'IN_STOCK'}
            onClick={() => updateParams({ condition: 'IN_STOCK' })}
          >
            {t.tabInStock}
          </TabButton>
        </div>

        <form
          role="search"
          onSubmit={submitSearch}
          className="relative min-w-0 xl:mx-6 xl:max-w-[320px] xl:flex-1"
        >
          <label className="block">
            <span className="sr-only">{t.searchLabel}</span>
            <input
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t.searchPlaceholder}
              maxLength={120}
              className="h-9 w-full rounded-pill bg-neutral-25 pl-3 pr-11 text-[12px] font-medium leading-[18px] text-neutral-800 placeholder:text-neutral-600 [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
          <button
            type="submit"
            aria-label={t.searchSubmit}
            className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-pill text-neutral-800 transition-colors duration-micro hover:text-accent"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M11 11l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
          <ListDropdown
            label={t.makePrefix}
            allLabel={t.allMakes}
            allRowLabel={t.tabAll}
            options={makes}
            value={make}
            onChange={(next) => updateParams({ make: next || null, model: null })}
          />
          <ListDropdown
            label={t.model}
            allLabel={t.model}
            allRowLabel={t.tabAll}
            options={models}
            value={model}
            onChange={(next) => updateParams({ model: next || null })}
          />
          <PriceDropdown
            label={t.price}
            fromLabel={t.priceFrom}
            toLabel={t.priceTo}
            min={PRICE_MIN}
            max={PRICE_MAX}
            low={priceMin}
            high={priceMax}
            onChange={(nextLow, nextHigh) => {
              setPriceMin(nextLow);
              setPriceMax(nextHigh);
            }}
            onCommit={commitPrice}
          />
        </div>
      </div>

      <div className="flex min-h-16 flex-wrap items-center gap-2 py-2">
        <p
          role="status"
          aria-live="polite"
          className="mr-2 text-[14px] font-medium text-neutral-800"
        >
          {total > 0 ? interpolate(t.resultCount, { count: String(total) }) : t.resultCountNone}
        </p>
        {chips.length > 0 && (
          <ul aria-label={t.activeFilters} className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  onClick={chip.clear}
                  aria-label={interpolate(t.removeFilter, { label: chip.label })}
                  className="flex min-h-11 items-center gap-2 rounded-pill bg-white px-4 text-[14px] text-neutral-800 transition-colors duration-standard hover:bg-neutral-50"
                >
                  {chip.label}
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {chips.length > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="min-h-11 rounded-pill px-3 text-[14px] font-medium text-neutral-800 underline underline-offset-4"
          >
            {t.reset}
          </button>
        )}
      </div>
    </div>
  );
}
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill px-4 py-2 text-[16px] font-medium leading-[24px] transition-colors duration-standard ${
        active ? 'bg-neutral-700 text-white' : 'text-neutral-800 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  );
}
