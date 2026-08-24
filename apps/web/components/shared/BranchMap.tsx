'use client';

import { useId, useState } from 'react';
import { BRANCHES, branchTelHref, type Branch } from '@/lib/data/branches';
import { messages, interpolate } from '@/lib/messages';
import { Button } from '@/components/ui/Button';

const t = messages.common.branchMap;

/**
 * Simplified `BranchMap`: a select-a-branch list + detail panel. Pins on a
 * real map are future work (needs lat/lng per `branches.md`'s open TODO) —
 * this satisfies the same "click a branch → see photo/address/phone/hours"
 * contract without inventing map tiles/coordinates.
 */
export function BranchMap() {
  const [activeId, setActiveId] = useState<Branch['id']>(BRANCHES[0].id);
  const panelId = useId();
  const active = BRANCHES.find((branch) => branch.id === activeId) ?? BRANCHES[0];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
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
                    ? 'border-accent bg-accent/5'
                    : 'border-line-light bg-white hover:border-accent/40'
                }`}
              >
                <p className="font-display font-semibold text-ink">
                  {branch.name} — {branch.city}
                </p>
                <p className="text-small text-muted">{branch.address}</p>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        id={panelId}
        className="rounded-lg border border-line-light bg-white p-6 shadow-card"
        aria-live="polite"
      >
        <div
          className="mb-5 flex aspect-[16/9] w-full items-center justify-center rounded-md bg-gradient-to-br from-ink via-surface to-muted/60 text-white/70"
          role="img"
          aria-label={interpolate(t.photoAlt, { name: `${active.name} — ${active.city}` })}
        >
          {/* TODO: replace with a real branch photo */}
          <span className="font-display text-lead font-semibold">{active.city}</span>
        </div>
        <p className="font-display text-h3 font-bold text-ink">
          {active.name} — {active.city}
        </p>
        <dl className="mt-4 space-y-2 text-body text-ink/80">
          <div className="flex gap-2">
            <dt className="font-medium text-ink">{t.addressLabel}:</dt>
            <dd>{active.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-ink">{t.phoneLabel}:</dt>
            <dd>
              <a href={branchTelHref(active.phone)} className="text-accent hover:underline">
                {active.phone}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-ink">{t.hoursLabel}:</dt>
            <dd>{active.hours}</dd>
          </div>
        </dl>
        <Button href={branchTelHref(active.phone)} variant="primary" className="mt-6">
          {t.cta}
        </Button>
      </div>
    </div>
  );
}
