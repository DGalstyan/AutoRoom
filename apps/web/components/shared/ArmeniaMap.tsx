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
 * Real Armenia outline (see `lib/data/armeniaMap.ts` for provenance), filled
 * with the same dot-matrix pattern as the site's other "presence map"
 * treatment (`public/images/home/world-map.jpg` — a world map silhouette
 * built from a grid of dots, not a solid or line-stroked shape), so the two
 * don't read as two different map styles. One animated pin per branch on
 * top. Each pin is a focusable button carrying the full name/city/address
 * in its `aria-label` — the floating tooltip is purely visual
 * (`aria-hidden`) and only ever duplicates what's already accessible
 * without it, so nothing is lost if it doesn't render.
 */
export function ArmeniaMap({ activeId, onSelect }: ArmeniaMapProps) {
  const [openId, setOpenId] = useState<Branch['id'] | null>(null);
  const patternId = useId();

  return (
    <div className="relative mx-auto aspect-[397/440] w-full max-w-sm">
      <svg
        viewBox={ARMENIA_OUTLINE_VIEWBOX}
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <defs>
          <pattern id={patternId} width="2.4" height="2.4" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="0.62" fill="white" fillOpacity="0.55" />
          </pattern>
        </defs>
        <path d={ARMENIA_OUTLINE_PATH} fill={`url(#${patternId})`} />
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
                  isActive
                    ? 'bg-accent shadow-[0_0_10px_2px_rgba(200,162,74,0.85)]'
                    : 'bg-white shadow-[0_0_8px_1px_rgba(255,255,255,0.6)]'
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
