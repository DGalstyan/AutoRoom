'use client';

import { useId, useState } from 'react';
import { BRANCHES, branchTelHref, type Branch } from '@/lib/data/branches';
import { messages, interpolate } from '@/lib/messages';
import { Button } from '@/components/ui/Button';
import { ArmeniaMap } from '@/components/shared/ArmeniaMap';

const t = messages.common.branchMap;

/**
 * Figma's Homepage branches section (node `9332:7854`) is a dark band with a
 * decorative world map graphic and a single CTA — no per-branch pins (the
 * source asset is a generic placeholder screenshot with pins over the US/AU,
 * not AutoRoom's real Armenia locations; see report). Since then, replaced
 * that placeholder with a real Armenia outline and an animated, tooltipped
 * pin per branch (see `ArmeniaMap`) — clicking a pin drives the same
 * `activeId` selection as the list below, so both stay in sync.
 */
export function BranchMap() {
  const [activeId, setActiveId] = useState<Branch['id']>(BRANCHES[0].id);
  const panelId = useId();
  const listId = useId();
  const active = BRANCHES.find((branch) => branch.id === activeId) ?? BRANCHES[0];

  return (
    <div>
      <ArmeniaMap activeId={activeId} onSelect={setActiveId} />

      <div className="mt-8 flex justify-center">
        <a
          href={`#${listId}`}
          className="inline-flex min-h-11 items-center justify-center rounded-pill bg-white/10 px-7 py-3 text-home-label font-normal text-white transition-colors duration-standard hover:bg-white/20"
        >
          {t.cta}
        </a>
      </div>

      <div
        id={listId}
        className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
      >
        <ul className="space-y-3" aria-label={t.selectPrompt}>
          {BRANCHES.map((branch) => {
            const isActive = branch.id === activeId;
            return (
              <li key={branch.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  aria-controls={panelId}
                  onClick={() => setActiveId(branch.id)}
                  className={`min-h-11 w-full rounded-md border px-5 py-4 text-left transition-colors duration-standard ease-expo ${
                    isActive
                      ? 'border-accent bg-accent/10'
                      : 'border-white/15 bg-white/5 hover:border-accent/40'
                  }`}
                >
                  <p className="font-display font-semibold text-white">
                    {branch.name} — {branch.city}
                  </p>
                  <p className="text-small text-white/60">{branch.address}</p>
                </button>
              </li>
            );
          })}
        </ul>

        <div
          id={panelId}
          className="rounded-xl border border-white/10 bg-white/5 p-6"
          aria-live="polite"
        >
          <div
            className="mb-5 flex aspect-[16/9] w-full items-center justify-center rounded-md bg-gradient-to-br from-surface via-bg to-black text-white/70"
            role="img"
            aria-label={interpolate(t.photoAlt, { name: `${active.name} — ${active.city}` })}
          >
            {/* TODO(content): swap for a real branch photo per location. */}
            <span className="font-display text-lead font-semibold">{active.city}</span>
          </div>
          <p className="font-display text-h3 font-bold text-white">
            {active.name} — {active.city}
          </p>
          <dl className="mt-4 space-y-2 text-body text-white/80">
            <div className="flex gap-2">
              <dt className="font-medium text-white">{t.addressLabel}:</dt>
              <dd>{active.address}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-white">{t.phoneLabel}:</dt>
              <dd>
                <a href={branchTelHref(active.phone)} className="text-accent hover:underline">
                  {active.phone}
                </a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-white">{t.hoursLabel}:</dt>
              <dd>{active.hours}</dd>
            </div>
          </dl>
          <Button href={branchTelHref(active.phone)} variant="primary" className="mt-6">
            {t.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
