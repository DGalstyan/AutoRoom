'use client';

import { useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMessages } from '@/components/shared/LocaleProvider';
import { interpolate } from '@/lib/messages';

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-[32px] bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-[70px]">
        <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-[24px] bg-neutral-25 px-4 py-3 sm:flex-nowrap sm:rounded-pill">
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

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t.makePrefix}
            value={make}
            onChange={(event) => updateParams({ make: event.target.value || null, model: null })}
            className="h-9 w-[200px] rounded-pill bg-neutral-25 px-3 text-[12px] font-medium text-neutral-800"
          >
            <option value="">{t.allMakes}</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            aria-label={t.model}
            value={model}
            onChange={(event) => updateParams({ model: event.target.value || null })}
            className="h-9 w-[200px] rounded-pill bg-neutral-25 px-3 text-[12px] font-medium text-neutral-800"
          >
            <option value="">{t.model}</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <PriceRangeDropdown
            min={priceMin}
            max={priceMax}
            onChange={(nextMin, nextMax) => {
              setPriceMin(nextMin);
              setPriceMax(nextMax);
            }}
            onCommit={commitPrice}
          />
        </div>
      </div>

      <form
        role="search"
        onSubmit={submitSearch}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label className="relative block flex-1">
          <span className="sr-only">{t.searchLabel}</span>
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t.searchPlaceholder}
            maxLength={120}
            className="h-11 w-full rounded-pill bg-white px-5 text-[14px] text-neutral-800 placeholder:text-neutral-500"
          />
        </label>
        <button
          type="submit"
          className="h-11 rounded-pill bg-neutral-700 px-6 text-[14px] font-medium text-white transition-colors duration-standard hover:bg-neutral-800"
        >
          {t.searchSubmit}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
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

/** `Գինը` — a native-input dual-range slider, `1,000`–`500,000`, committed on release. */
function PriceRangeDropdown({
  min,
  max,
  onChange,
  onCommit,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
  onCommit: (min: number, max: number) => void;
}) {
  const t = useMessages().china.filters;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-9 w-[200px] items-center rounded-pill bg-neutral-25 px-3 text-left text-[12px] font-medium text-neutral-800"
      >
        {min > PRICE_MIN || max < PRICE_MAX
          ? `${min.toLocaleString('en-US')}$ – ${max.toLocaleString('en-US')}$`
          : t.price}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-[320px] rounded-[20px] bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <label className="flex-1">
              <span className="mb-1 block text-[12px] font-medium text-neutral-800">
                {t.priceFrom}
              </span>
              <input
                type="number"
                min={PRICE_MIN}
                max={max}
                value={min}
                onChange={(event) =>
                  onChange(Math.min(Number(event.target.value) || PRICE_MIN, max), max)
                }
                onBlur={() => onCommit(min, max)}
                className="w-full rounded-md border border-line-light px-2 py-1 text-[14px]"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-[12px] font-medium text-neutral-800">
                {t.priceTo}
              </span>
              <input
                type="number"
                min={min}
                max={PRICE_MAX}
                value={max}
                onChange={(event) =>
                  onChange(min, Math.max(Number(event.target.value) || PRICE_MAX, min))
                }
                onBlur={() => onCommit(min, max)}
                className="w-full rounded-md border border-line-light px-2 py-1 text-[14px]"
              />
            </label>
          </div>

          <div className="relative h-[9px] rounded-pill bg-neutral-100">
            <div
              className="absolute h-full rounded-pill bg-accent"
              style={{
                left: `${((min - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                right: `${100 - ((max - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              value={min}
              onChange={(event) => onChange(Math.min(Number(event.target.value), max), max)}
              onMouseUp={() => onCommit(min, max)}
              onTouchEnd={() => onCommit(min, max)}
              className="pointer-events-none absolute left-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              value={max}
              onChange={(event) => onChange(min, Math.max(Number(event.target.value), min))}
              onMouseUp={() => onCommit(min, max)}
              onTouchEnd={() => onCommit(min, max)}
              className="pointer-events-none absolute left-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
          </div>

          <div className="mt-2 flex justify-between text-[12px] text-muted">
            <span className="tabular-nums">{PRICE_MIN.toLocaleString('en-US')}$</span>
            <span className="tabular-nums">{PRICE_MAX.toLocaleString('en-US')}$</span>
          </div>
        </div>
      )}
    </div>
  );
}
