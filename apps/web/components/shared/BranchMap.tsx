'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { CarImage } from '@/components/shared/CarImage';
import { BRANCHES, directionsUrl, type Branch } from '@/data/branches';
import { t } from '@/lib/i18n';
import { cn, telHref } from '@/lib/utils';

/**
 * "Մեր մասնաճյուղերը / Միշտ քո կողքին" — Homepage Section 8 and the Contact page.
 *
 * Selecting a branch (from the map or the list) opens its panel: photo, address,
 * click-to-call phone, hours and a `Ուղղություն` link to Google Maps.
 *
 * The map surface places pins from `lat`/`lng`. The client has not supplied
 * coordinates yet, so today it renders as a labelled plate and the branch list
 * carries the interaction — every branch stays reachable either way, and pins
 * light up on their own once `data/branches.ts` gains coordinates.
 * TODO(client): coordinates + the Armenia map asset (see references/branches.md).
 */

/** Armenia's bounding box, used to project lat/lng into the map plate. */
const BOUNDS = { minLat: 38.8, maxLat: 41.35, minLng: 43.4, maxLng: 46.7 };

function project(branch: Branch) {
  if (branch.lat === undefined || branch.lng === undefined) return null;
  return {
    left: ((branch.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100,
    top: ((BOUNDS.maxLat - branch.lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100,
  };
}

export interface BranchMapProps {
  branches?: Branch[];
  /** Section CTA target; Homepage points at the Contact page. */
  ctaHref?: string;
  showHeading?: boolean;
  className?: string;
}

export function BranchMap({
  branches = BRANCHES,
  ctaHref = '/contact',
  showHeading = true,
  className,
}: BranchMapProps) {
  const [selectedId, setSelectedId] = useState(branches[0]?.id);
  const selected = branches.find((branch) => branch.id === selectedId) ?? branches[0];

  if (!selected) return null;

  return (
    <section className={cn('flex flex-col gap-8', className)}>
      {showHeading ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-h2">{t('branchMap.title')}</h2>
          <p className="text-lead text-muted">{t('branchMap.subtitle')}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line-light bg-surface-light lg:col-span-3">
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(228,0,43,0.08),transparent_60%)]"
          />
          {branches.map((branch) => {
            const position = project(branch);
            if (!position) return null;
            const active = branch.id === selected.id;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedId(branch.id)}
                aria-pressed={active}
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-full rounded-pill px-3 py-1.5 text-caption font-semibold shadow-card',
                  'transition-transform duration-standard ease-expo hover:scale-105',
                  active ? 'bg-accent text-paper' : 'bg-paper text-ink',
                )}
              >
                {branch.city}
              </button>
            );
          })}

          {/* Fallback while coordinates are pending: the list below is the map. */}
          {branches.every((branch) => project(branch) === null) ? (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-small text-muted">
              {t('branchMap.selectBranch')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <ul className="flex flex-wrap gap-2">
            {branches.map((branch) => (
              <li key={branch.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(branch.id)}
                  aria-pressed={branch.id === selected.id}
                  className={cn(
                    'rounded-pill border px-4 py-2 text-small font-medium transition-colors duration-micro',
                    branch.id === selected.id
                      ? 'border-accent bg-accent text-paper'
                      : 'border-line-light bg-paper text-ink hover:border-ink',
                  )}
                >
                  {branch.city}
                </button>
              </li>
            ))}
          </ul>

          <BranchPanel branch={selected} />
        </div>
      </div>

      <div>
        <Button href={ctaHref}>{t('common.cta.visitNearestBranch')}</Button>
      </div>
    </section>
  );
}

/** The panel behind a pin — also used as a standalone card on the Contact page. */
export function BranchPanel({ branch, className }: { branch: Branch; className?: string }) {
  return (
    <article
      className={cn(
        'flex flex-1 flex-col gap-4 rounded-lg border border-line-light bg-paper p-5 shadow-card',
        className,
      )}
    >
      {branch.photo ? (
        <div className="aspect-[16/9] overflow-hidden rounded-md bg-surface-light">
          <CarImage src={branch.photo} alt={branch.name} />
        </div>
      ) : null}

      <div>
        <h3 className="text-lead font-semibold">{branch.name}</h3>
        <p className="text-small text-muted">{branch.city}</p>
      </div>

      <dl className="flex flex-col gap-2 text-small">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t('branchMap.address')}</dt>
          <dd className="text-right font-medium">{branch.address}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t('branchMap.phone')}</dt>
          <dd className="text-right font-medium">
            <Link href={telHref(branch.phone)} className="hover:text-accent">
              {branch.phone}
            </Link>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t('branchMap.hours')}</dt>
          <dd className="text-right font-medium">{branch.hours}</dd>
        </div>
      </dl>

      <Button href={directionsUrl(branch)} external variant="outline" size="sm">
        {t('common.cta.directions')}
      </Button>
    </article>
  );
}
