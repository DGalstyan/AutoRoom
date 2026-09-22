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
 * մեքենաների ներմուծման մասին մեր փորձից" — "Reels/video cards"). An earlier
 * pass here claimed no Figma node covers this section — wrong, the same
 * "stopped one frame too shallow" mistake `UsaImportProcess`'s own doc
 * comment already flags elsewhere on this page. The real node is 218:177's
 * `Frame 1597885997` (verified via get_design_context): a centered
 * `Headings/H1-Light Mid` heading over an edge-to-edge 4-across, 2-row grid
 * of portrait video stills — no gap, no rounded corners, no visible title
 * caption — each with a 122px circular play button (`fill="black"
 * fill-opacity="0.2"`, white glyph, no blur, from the node's own exported
 * `Frame 1597885820` asset). That's pixel-identical to `CustomerStoryWall`'s
 * own already-verified grid (Homepage S7, node 110:432) apart from the
 * button's tint, so this reuses that component's `aspect-[336/502]`/grid/gap
 * treatment directly instead of the invented landscape 3-up cards from
 * before, and its `PlayGlyph` triangle in place of hand-tracing the asset's
 * custom bezier glyph (same silhouette, already established elsewhere).
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
      <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="mt-10 grid grid-cols-2 gap-0 md:grid-cols-4">
        {reels.map((reel) => (
          <button
            key={reel.id}
            type="button"
            onClick={() => setActive(reel)}
            className="group relative aspect-[336/502] w-full overflow-hidden bg-ink transition-transform duration-standard ease-expo hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {reel.posterUrl && (
              <Image
                src={reel.posterUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            )}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 flex h-[122px] w-[122px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-black/20 text-white transition-transform duration-standard group-hover:scale-110"
            >
              <PlayGlyph size={36} />
            </span>
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
