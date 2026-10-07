'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ListDropdown, PriceDropdown } from '@/components/china/FilterDropdowns';
import { useMessages } from '@/components/shared/LocaleProvider';
import type { AuctionPlatform } from '@/lib/types/car';

const PRICE_MIN = 1_000;
const PRICE_MAX = 500_000;

const PLATFORMS: readonly AuctionPlatform[] = ['COPART', 'IAAI', 'MANHEIM'];

/**
 * `/usa` "best auctions" filter bar — Figma 440:3103: a 1344×88 white pill
 * holding the platform tabs (Բոլորը / Copart Deal / IAAI Deal / Manheim Deal,
 * writing `auctionPlatform`) and the same Make / Model / Price dropdowns as the
 * China listing. A client component that only ever edits `searchParams`; the
 * fetch stays server-side in `app/usa/page.tsx`, same contract as `ChinaFilters`.
 *
 * `makeModels` is scoped to USA `AUCTION` cars only (not every USA car) — this
 * bar sits above the auction grid specifically, not the whole page.
 */
export function UsaAuctionFilters({ makeModels }: { makeModels: Record<string, string[]> }) {
  const t = useMessages().usa.bestAuctions.filters;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const platform = searchParams.get('auctionPlatform') ?? '';
  const make = searchParams.get('make') ?? '';
  const model = searchParams.get('model') ?? '';

  const urlMin = Number(searchParams.get('priceMin') ?? PRICE_MIN);
  const urlMax = Number(searchParams.get('priceMax') ?? PRICE_MAX);
  const [priceMin, setPriceMin] = useState(urlMin);
  const [priceMax, setPriceMax] = useState(urlMax);
  // Back/forward changes the URL; re-sync the local slider to it while rendering.
  const [seenUrl, setSeenUrl] = useState(`${urlMin}|${urlMax}`);
  if (seenUrl !== `${urlMin}|${urlMax}`) {
    setSeenUrl(`${urlMin}|${urlMax}`);
    setPriceMin(urlMin);
    setPriceMax(urlMax);
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

  const platformLabel: Record<AuctionPlatform, string> = {
    COPART: t.tabCopart,
    IAAI: t.tabIaai,
    MANHEIM: t.tabManheim,
  };

  return (
    <div className="flex flex-col gap-4 rounded-[32px] bg-white px-6 py-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6 xl:rounded-[70px]">
      <div
        role="group"
        className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-[24px] bg-neutral-25 px-4 py-3 sm:w-fit sm:rounded-pill"
      >
        <TabButton active={platform === ''} onClick={() => updateParams({ auctionPlatform: null })}>
          {t.tabAll}
        </TabButton>
        {PLATFORMS.map((p) => (
          <TabButton
            key={p}
            active={platform === p}
            onClick={() => updateParams({ auctionPlatform: p })}
          >
            {platformLabel[p]}
          </TabButton>
        ))}
      </div>

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
      aria-pressed={active}
      className={`rounded-[52px] px-4 py-2 text-[16px] leading-[24px] transition-colors duration-standard ${
        active
          ? 'bg-neutral-700 font-medium text-white'
          : 'font-normal text-neutral-800 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  );
}
