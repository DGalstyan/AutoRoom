'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { MOCK_STORIES, type CustomerStory } from '@/lib/data/mockStories';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * Video wall — grid of real portrait stills (real 60–90s videos pending from
 * the content team; see `lib/data/mockStories.ts`). Matches Figma's 4x2
 * grid (node `9321:6185`), which carries no visible section heading — kept
 * as an sr-only `h2` for the a11y outline.
 */
export function CustomerStoryWall() {
  const t = useMessages().home.stories;
  const [active, setActive] = useState<CustomerStory | null>(null);

  return (
    <div>
      <h2 className="sr-only">{t.heading}</h2>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {MOCK_STORIES.map((story, index) => (
          <button
            key={story.id}
            type="button"
            onClick={() => setActive(story)}
            className="group relative aspect-[336/502] w-full overflow-hidden rounded-xl transition-transform duration-standard ease-expo hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Image
              src={story.image}
              alt=""
              fill
              priority={index === 0}
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-black/15 transition-colors duration-standard group-hover:bg-black/35"
              aria-hidden="true"
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-white/20 text-white backdrop-blur transition-transform duration-standard group-hover:scale-110"
            >
              <PlayGlyph />
            </span>
            <span className="sr-only">
              {story.customerName} — {story.car}, {t.playLabel}
            </span>
          </button>
        ))}
      </div>

      {active && <StoryLightbox story={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function StoryLightbox({ story, onClose }: { story: CustomerStory; onClose: () => void }) {
  const messages = useMessages();
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
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-surface text-white outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={messages.common.popup.close}
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-pill bg-black/40 text-white hover:bg-black/60"
        >
          ×
        </button>
        <div className="relative aspect-video w-full bg-black">
          <Image src={story.image} alt="" fill sizes="448px" className="object-cover opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            {/* TODO(content): swap for the real <video muted={false} playsInline controls>
                once the 60–90s customer footage is delivered. */}
            <PlayGlyph size={40} />
          </div>
        </div>
        <div className="p-6">
          <p id={titleId} className="font-display font-semibold">
            {story.customerName} — {story.car}
          </p>
          <p className="text-small text-white/60">
            {story.origin} · {story.whyChosen}
          </p>
        </div>
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
