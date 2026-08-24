'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { MOCK_STORIES, type CustomerStory } from '@/lib/data/mockStories';
import { messages } from '@/lib/messages';

const t = messages.home.stories;

/**
 * Video wall — grid of labeled placeholder thumbnails. No real video assets
 * yet (see `lib/data/mockStories.ts`); clicking opens a lightbox shell so the
 * interaction/a11y pattern is proven ahead of the real footage landing.
 */
export function CustomerStoryWall() {
  const [active, setActive] = useState<CustomerStory | null>(null);

  return (
    <div>
      <p className="text-caption font-semibold uppercase tracking-wide text-accent">{t.eyebrow}</p>
      <h2 className="mt-2 font-display text-h2 font-bold text-white">{t.heading}</h2>
      <p className="mt-2 max-w-2xl text-body text-white/60">{t.sub}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {MOCK_STORIES.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => setActive(story)}
            className="group relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br from-surface via-bg to-black p-4 text-left transition-transform duration-standard ease-expo hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span
              aria-hidden="true"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-pill bg-white/15 text-white"
            >
              <PlayGlyph />
            </span>
            <p className="font-display text-small font-semibold text-white">{story.customerName}</p>
            <p className="text-caption text-white/60">
              {story.car} · {story.origin}
            </p>
            <span className="sr-only"> — {t.playLabel}</span>
          </button>
        ))}
      </div>

      {active && <StoryLightbox story={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function StoryLightbox({ story, onClose }: { story: CustomerStory; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, true, onClose);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-lg bg-surface p-6 text-white outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={messages.common.popup.close}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-pill text-white/70 hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
        <p id={titleId} className="font-display text-h3 font-bold">
          {t.lightboxTitle}
        </p>
        <div
          className="mt-4 flex aspect-video items-center justify-center rounded-md bg-black/40 text-white/40"
          aria-hidden="true"
        >
          {/* TODO: replace with the real <video> (muted, playsInline, poster, preload="none") */}
          <PlayGlyph size={40} />
        </div>
        <p className="mt-4 font-display font-semibold">
          {story.customerName} — {story.car}
        </p>
        <p className="text-small text-white/60">
          {story.origin} · {story.whyChosen}
        </p>
      </div>
    </div>
  );
}

function PlayGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 2.5v11l10-5.5-10-5.5Z" fill="currentColor" />
    </svg>
  );
}
