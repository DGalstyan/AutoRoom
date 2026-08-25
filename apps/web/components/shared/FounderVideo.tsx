'use client';

import Image from 'next/image';
import { useState } from 'react';
import { messages } from '@/lib/messages';

const t = messages.home.founder;

/**
 * Founder storytelling video (≤1.5 min). Figma (node `9321:6212`) shows a
 * full embed-style player chrome (title overlay, scrubber, time, volume,
 * fullscreen…) around a real poster frame — we keep the poster + a single
 * accessible play affordance and let the browser's native `<video>` controls
 * take over once playing, rather than hand-rolling a fragile custom YouTube
 * chrome. No real video file has been delivered yet (see report), so playing
 * currently reveals a stand-in; swapping in the real asset is a one-line change.
 */
export function FounderVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <h2 className="sr-only">{t.heading}</h2>
      <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-xl bg-bg shadow-card">
        <Image
          src="/images/home/founder-poster.jpg"
          alt={t.posterAlt}
          fill
          sizes="(min-width: 1024px) 1152px, 100vw"
          className="object-cover"
        />

        {!playing ? (
          <>
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40"
              aria-hidden="true"
            />
            <p className="absolute left-4 top-4 max-w-[80%] font-display text-lead font-normal text-white sm:left-8 sm:top-8 sm:text-h3">
              {t.heading}
            </p>
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={t.playLabel}
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-accent text-ink transition-transform duration-standard ease-expo hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 2.5v11l10-5.5-10-5.5Z" fill="currentColor" />
              </svg>
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/95 px-6 text-center">
            {/* TODO(content): swap for a real <video muted={false} playsInline controls
                src="/videos/founder.mp4" autoPlay> once the asset lands. */}
            <p className="text-small text-white/60">{t.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
