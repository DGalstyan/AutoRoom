'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { messages } from '@/lib/messages';

const t = messages.china.filters;

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
export function ChinaFilters({ makeModels }: { makeModels: Record<string, string[]> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const condition = searchParams.get('condition') ?? '';
  const make = searchParams.get('make') ?? '';
  const model = searchParams.get('model') ?? '';

  const [priceMin, setPriceMin] = useState(Number(searchParams.get('priceMin') ?? PRICE_MIN));
  const [priceMax, setPriceMax] = useState(Number(searchParams.get('priceMax') ?? PRICE_MAX));

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

  return (
    <div className="flex flex-col gap-4 rounded-pill bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex items-center gap-3 rounded-pill bg-neutral-25 px-4 py-3">
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
              className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              value={max}
              onChange={(event) => onChange(min, Math.max(Number(event.target.value), min))}
              onMouseUp={() => onCommit(min, max)}
              onTouchEnd={() => onCommit(min, max)}
              className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
          </div>

          <div className="mt-2 flex justify-between text-[12px] text-muted">
            <span>{PRICE_MIN.toLocaleString('en-US')}$</span>
            <span>{PRICE_MAX.toLocaleString('en-US')}$</span>
          </div>
        </div>
      )}
    </div>
  );
}
