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
      <div className="inline-flex items-center gap-2 rounded-pill bg-neutral-25 p-3">
        <TabButton active={tab === 'current'} onClick={() => setTab('current')}>
          {currentLabel} ({currentCount})
        </TabButton>
        <TabButton active={tab === 'past'} onClick={() => setTab('past')}>
          {pastLabel} ({pastCount})
        </TabButton>
      </div>

      <div className="mt-8">{tab === 'current' ? currentContent : pastContent}</div>
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
