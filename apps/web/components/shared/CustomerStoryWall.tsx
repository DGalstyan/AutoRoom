'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import type { CustomerStory } from '@/lib/media';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * Video wall — grid of real customer-story clips, admin-managed via the
 * Stories screen (`Media` rows, `kind: CUSTOMER_STORY`), fetched server-side
 * by the Homepage (`lib/media.ts#listCustomerStories`) and passed down here.
 * Matches Figma's 4x2 grid (node `110:432`, verified via get_design_context:
 * cards are edge-to-edge with square corners, and the play icon is 122px,
 * not a smaller pill), which carries no visible section heading — kept as
 * an sr-only `h2` for the a11y outline.
 *
 * Each tile shows its poster still by default and only starts playing (muted,
 * looping) on hover/focus — a lightweight preview, not the real story. A
 * click opens the lightbox with the actual `<video controls>`, sound on.
 * Renders nothing when there's nothing published yet, same as every other
 * admin-curated grid on the site — no static placeholder stand-in.
 */
export function CustomerStoryWall({ stories }: { stories: CustomerStory[] }) {
  const t = useMessages().home.stories;
  const [active, setActive] = useState<CustomerStory | null>(null);

  if (stories.length === 0) return null;

  return (
    <div>
      <h2 className="sr-only">{t.heading}</h2>

      <div className="grid grid-cols-2 gap-0 md:grid-cols-4">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            playLabel={t.playLabel}
            onOpen={() => setActive(story)}
          />
        ))}
      </div>

      {active && <StoryLightbox story={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function StoryCard({
  story,
  playLabel,
  onOpen,
}: {
  story: CustomerStory;
  playLabel: string;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const startPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Autoplay can be blocked even when muted (rare, policy-dependent) —
      // the poster stays on screen, which is a fine fallback.
    });
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  const label = [story.customerName, story.carLabel].filter(Boolean).join(' — ');

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
      className="group relative aspect-[336/502] w-full overflow-hidden transition-transform duration-standard ease-expo hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <video
        ref={videoRef}
        src={story.videoUrl}
        poster={story.posterUrl ?? undefined}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 bg-black/15 transition-colors duration-standard group-hover:bg-black/35"
        aria-hidden="true"
      />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex h-[122px] w-[122px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-white/20 text-white backdrop-blur transition-transform duration-standard group-hover:scale-110"
      >
        <PlayGlyph size={36} />
      </span>
      <span className="sr-only">
        {label || playLabel} — {playLabel}
      </span>
    </button>
  );
}

function StoryLightbox({ story, onClose }: { story: CustomerStory; onClose: () => void }) {
  const messages = useMessages();
  const nav = messages.common.nav;
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

  const originLabel =
    story.origin === 'CHINA' ? nav.china : story.origin === 'USA' ? nav.usa : null;
  const subtitle = [originLabel, story.whyChosen].filter(Boolean).join(' · ');
  const title =
    [story.customerName, story.carLabel].filter(Boolean).join(' — ') ||
    messages.home.stories.lightboxTitle;

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
          <video
            src={story.videoUrl}
            poster={story.posterUrl ?? undefined}
            className="absolute inset-0 h-full w-full object-cover"
            controls
            autoPlay
            playsInline
          >
            <track kind="captions" />
          </video>
        </div>
        <div className="p-6">
          <p id={titleId} className="font-display font-semibold">
            {title}
          </p>
          {subtitle && <p className="text-small text-white/60">{subtitle}</p>}
          {story.experience && <p className="mt-2 text-small text-white/80">{story.experience}</p>}
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
