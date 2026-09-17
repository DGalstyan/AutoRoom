'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useMessages } from '@/components/shared/LocaleProvider';
import { Section } from '@/components/ui/Section';
import { toYouTubeEmbedUrl } from '@/lib/youtube';
import type { GuideReel } from '@/lib/media';

/**
 * `/usa` S8b "Useful guides" (`references/pages.md` §4: H "Սովորիր
 * մեքենաների ներմուծման մասին մեր փորձից" — "Reels/video cards"). No Figma
 * node covers this section (an earlier pass here looked and came up empty —
 * see `app/usa/page.tsx`'s doc comment), so the card treatment is built from
 * the site's own established video patterns instead of a mock: the poster +
 * play-glyph card from `CustomerStoryWall` (Homepage S7), and the
 * YouTube-embed-or-direct-file lightbox player from `FounderVideo`.
 *
 * `reels` is the admin's `Media` rows with `kind: GUIDE_REEL` — a type that
 * already existed in the schema/API/admin Stories screen (labelled "Guide
 * reel" there) but had no public-site consumer until this component. Server
 * fetched via `lib/media.ts#listGuideReels` and passed down, same
 * never-fetches-itself contract as `FounderVideo`. Renders nothing when
 * empty, matching every other admin-curated grid on the site.
 */
export function UsaGuideReels({ reels }: { reels: GuideReel[] }) {
  const t = useMessages().usa.usefulGuides;
  const [active, setActive] = useState<GuideReel | null>(null);

  if (reels.length === 0) return null;

  return (
    <Section tone="light">
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reels.map((reel) => (
          <button
            key={reel.id}
            type="button"
            onClick={() => setActive(reel)}
            className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-ink transition-transform duration-standard ease-expo hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {reel.posterUrl && (
              <Image
                src={reel.posterUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            )}
            <div
              className="absolute inset-0 bg-black/25 transition-colors duration-standard group-hover:bg-black/40"
              aria-hidden="true"
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-accent text-ink transition-transform duration-standard group-hover:scale-110"
            >
              <PlayGlyph size={20} />
            </span>
            <p className="absolute inset-x-0 bottom-0 p-4 text-left text-small font-medium text-white">
              {reel.title}
            </p>
            <span className="sr-only">
              {reel.title} — {t.playLabel}
            </span>
          </button>
        ))}
      </div>

      {active && <ReelLightbox reel={active} onClose={() => setActive(null)} />}
    </Section>
  );
}

function ReelLightbox({ reel, onClose }: { reel: GuideReel; onClose: () => void }) {
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

  const embedUrl = toYouTubeEmbedUrl(reel.videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-surface text-white outline-none"
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
          {embedUrl ? (
            <iframe
              src={`${embedUrl}?autoplay=1&rel=0`}
              title={reel.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <video
              src={reel.videoUrl}
              poster={reel.posterUrl ?? undefined}
              className="absolute inset-0 h-full w-full object-cover"
              controls
              autoPlay
              playsInline
            >
              <track kind="captions" />
            </video>
          )}
        </div>
        <p id={titleId} className="p-6 font-display font-semibold">
          {reel.title}
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
