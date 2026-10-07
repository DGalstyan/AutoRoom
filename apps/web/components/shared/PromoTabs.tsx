'use client';

import { useState, type ReactNode } from 'react';

/**
 * "Ընթացիկ | Անցած" toggle for the /offers page's promotions grid
 * (`references/pages.md` "Special offers" S2). Both grids are pre-rendered
 * server-side (each car card is itself an async Server Component) and
 * handed down as already-resolved `ReactNode`s — this client leaf only
 * decides which one is visible, the same "server content, client toggle"
 * split `ChinaFilters`' tab buttons use for their own styling, just without
 * a URL round-trip since there's no server-side filtering to do here.
 */
export function PromoTabs({
  currentLabel,
  pastLabel,
  currentCount,
  pastCount,
  currentContent,
  pastContent,
}: {
  currentLabel: string;
  pastLabel: string;
  currentCount: number;
  pastCount: number;
  currentContent: ReactNode;
  pastContent: ReactNode;
}) {
  const [tab, setTab] = useState<'current' | 'past'>('current');

  return (
    <div>
      <div
        role="tablist"
        className="inline-flex items-center gap-3 rounded-pill bg-neutral-25 px-4 py-3"
      >
        <TabButton
          active={tab === 'current'}
          label={`${currentLabel} (${currentCount})`}
          onClick={() => setTab('current')}
        >
          {currentLabel}
        </TabButton>
        <TabButton
          active={tab === 'past'}
          label={`${pastLabel} (${pastCount})`}
          onClick={() => setTab('past')}
        >
          {pastLabel}
        </TabButton>
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === 'current' ? currentContent : pastContent}
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  /** Accessible name — carries the count the design leaves out of the visible label. */
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      onClick={onClick}
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
