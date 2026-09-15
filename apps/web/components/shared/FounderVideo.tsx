'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useMessages } from '@/components/shared/LocaleProvider';
import { toYouTubeEmbedUrl } from '@/lib/youtube';
import type { FounderVideo as FounderVideoData } from '@/lib/media';

/**
 * Founder storytelling video (≤1.5 min). Figma (node `110:459`) shows a
 * full embed-style player chrome (title overlay, scrubber, time, volume,
 * fullscreen…) around a real poster frame — we keep the poster + a single
 * accessible play affordance and swap in the real player only once someone
 * asks for it, rather than hand-rolling a fragile custom YouTube chrome or
 * loading YouTube's iframe (and its JS) before anyone has pressed play.
 *
 * `video` is the admin-managed `Media` row (`kind: FOUNDER`), fetched
 * server-side via `lib/media.ts#getFounderVideo` and passed down by the
 * page — this component never fetches itself, it only knows how to play
 * what it is given. When `video` is `null` (no row published yet / API
 * unreachable) we fall back to the static stand-in that always existed
 * here, so the section never renders a broken player.
 *
 * `videoUrl` isn't always a YouTube link: the admin's Stories screen lets
 * an editor either paste one or upload a file directly (`UploadField`,
 * posting to `POST /uploads`), and a direct upload's URL points at our own
 * `/uploads/<file>.mp4` — `toYouTubeEmbedUrl` correctly returns `null` for
 * that (it only recognizes YouTube hosts), but this component used to
 * treat "not YouTube" as "nothing to play at all" and show the "no video
 * yet" placeholder even with a perfectly good uploaded file sitting right
 * there. Anything with a `videoUrl` that isn't a YouTube link now plays as
 * a plain `<video>` instead.
 *
 * `heading` overrides the overlay title only — About reuses this component
 * (Figma node `123:401`, file `9Lq4XpWusTJj1VnM6laAZr`) with its own
 * "Ինչպես սկսվեց AutoRoom-ը" wording instead of Homepage's phrasing, same
 * video treatment otherwise. This is on purpose kept independent of
 * `video.title` (the admin's internal label for the row) — the on-page
 * heading is reviewed marketing copy from `messages/hy.json`, not a CMS
 * field an editor could accidentally overwrite.
 */
export function FounderVideo({
  heading,
  video = null,
}: { heading?: string; video?: FounderVideoData | null } = {}) {
  const t = useMessages().home.founder;
  const [playing, setPlaying] = useState(false);
  const displayHeading = heading ?? t.heading;
  const embedUrl = video ? toYouTubeEmbedUrl(video.videoUrl) : null;
  // Has a videoUrl, just not a YouTube one — a direct upload's file URL.
  const directVideoUrl = video && !embedUrl ? video.videoUrl : null;
  const posterSrc = video?.posterUrl || '/images/home/founder-poster.jpg';

  return (
    <div>
      <h2 className="sr-only">{displayHeading}</h2>
      <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-xl bg-bg shadow-card">
        {playing && embedUrl ? (
          <iframe
            src={`${embedUrl}?autoplay=1&rel=0`}
            title={video?.title ?? displayHeading}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : playing && directVideoUrl ? (
          <video
            src={directVideoUrl}
            poster={video?.posterUrl ?? undefined}
            className="absolute inset-0 h-full w-full object-cover"
            controls
            autoPlay
            playsInline
          >
            <track kind="captions" />
          </video>
        ) : (
          <>
            <Image
              src={posterSrc}
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
                <p className="absolute left-4 top-4 max-w-[80%] font-display text-lead font-normal text-white sm:left-8 sm:top-14 sm:text-[29.4px] sm:leading-[1.3]">
                  {displayHeading}
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
              // Pressed play but there's nothing embeddable yet (no `video`,
              // or a `videoUrl` we couldn't recognize as YouTube) — a
              // labeled stand-in beats a silently broken player.
              <div className="absolute inset-0 flex items-center justify-center bg-bg/95 px-6 text-center">
                <p className="text-small text-white/60">{t.text}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
