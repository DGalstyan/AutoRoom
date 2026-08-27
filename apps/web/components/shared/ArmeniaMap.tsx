'use client';

import { useId, useState } from 'react';
import {
  ARMENIA_OUTLINE_PATH,
  ARMENIA_OUTLINE_VIEWBOX,
  BRANCH_MAP_POSITIONS,
} from '@/lib/data/armeniaMap';
import { BRANCHES, type Branch } from '@/lib/data/branches';

interface ArmeniaMapProps {
  activeId: Branch['id'];
  onSelect: (id: Branch['id']) => void;
}

/**
 * Real Armenia outline (see `lib/data/armeniaMap.ts` for provenance) with an
 * animated pin per branch. Each pin is a focusable button carrying the full
 * name/city/address in its `aria-label` — the floating tooltip is purely
 * visual (`aria-hidden`) and only ever duplicates what's already accessible
 * without it, so nothing is lost if it doesn't render.
 */
export function ArmeniaMap({ activeId, onSelect }: ArmeniaMapProps) {
  const [openId, setOpenId] = useState<Branch['id'] | null>(null);
  const gradientId = useId();

  return (
    <div className="relative mx-auto aspect-[397/440] w-full max-w-sm">
      <svg
        viewBox={ARMENIA_OUTLINE_VIEWBOX}
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.03" />
            <stop offset="100%" stopColor="white" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path
          d={ARMENIA_OUTLINE_PATH}
          fill={`url(#${gradientId})`}
          stroke="white"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {BRANCHES.map((branch) => {
        const pos = BRANCH_MAP_POSITIONS[branch.id];
        if (!pos) return null;
        const isOpen = openId === branch.id;
        const isActive = activeId === branch.id;

        return (
          <div
            key={branch.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            <button
              type="button"
              aria-label={`${branch.name} — ${branch.city}, ${branch.address}`}
              aria-pressed={isActive}
              onMouseEnter={() => setOpenId(branch.id)}
              onFocus={() => setOpenId(branch.id)}
              onMouseLeave={() => setOpenId((current) => (current === branch.id ? null : current))}
              onBlur={() => setOpenId((current) => (current === branch.id ? null : current))}
              onClick={() => {
                onSelect(branch.id);
                setOpenId(branch.id);
              }}
              className="relative flex size-6 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {/* Pulsing ring — the animation itself; the solid dot underneath
                  stays the actually-clickable/visible marker when motion is
                  reduced. */}
              <span
                aria-hidden="true"
                className={`absolute inline-flex size-3 animate-ping rounded-full motion-reduce:animate-none ${
                  isActive ? 'bg-accent' : 'bg-white'
                } opacity-60`}
              />
              <span
                aria-hidden="true"
                className={`relative inline-flex size-3 rounded-full ring-2 ring-bg ${
                  isActive ? 'bg-accent' : 'bg-white'
                }`}
              />
            </button>

            {isOpen && (
              <div
                role="tooltip"
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-[180px] -translate-x-1/2 rounded-md border border-white/10 bg-bg px-3 py-2 text-center shadow-card"
              >
                <p className="text-small font-semibold text-white">
                  {branch.name} — {branch.city}
                </p>
                <p className="text-caption text-white/60">{branch.address}</p>
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-full -mt-px size-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-bg"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
