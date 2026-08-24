'use client';

import { useState } from 'react';
import { messages } from '@/lib/messages';

const t = messages.home.founder;

/**
 * Founder storytelling video (≤1.5 min) — placeholder poster + play affordance.
 * No real asset yet. Per the motion spec, video only plays on user action; once
 * a real file lands, swap the placeholder for a lazy `<video muted playsInline
 * preload="none" poster="...">` and keep this same play-on-click gesture.
 */
export function FounderVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
      <div>
        <p className="text-caption font-semibold uppercase tracking-wide text-accent">{t.eyebrow}</p>
        <h2 className="mt-2 font-display text-h2 font-bold text-white">{t.heading}</h2>
        <p className="mt-3 max-w-md text-body text-white/60">{t.text}</p>
      </div>
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-surface via-bg to-black"
        aria-label={t.posterAlt}
        role="img"
      >
        {/* TODO: replace with the real founder video asset (lazy, muted, playsInline) */}
        {!playing ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={t.playLabel}
            className="flex h-16 w-16 items-center justify-center rounded-pill bg-accent text-white transition-transform duration-standard ease-expo hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 2.5v11l10-5.5-10-5.5Z" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <p className="px-6 text-center text-small text-white/50">
            {/* Stand-in for the real <video> element once the asset is delivered. */}
            {t.heading}
          </p>
        )}
      </div>
    </div>
  );
}
