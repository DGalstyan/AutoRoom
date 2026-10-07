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
  const posterSrc = video?.posterUrl || '/images/home/v2/founder-poster-cover.webp';

  return (
    <div>
      <h2 className="sr-only">{displayHeading}</h2>
      <div className="relative mx-auto aspect-video w-full overflow-hidden bg-bg min-[1400px]:aspect-auto min-[1400px]:h-[756px] min-[1400px]:max-w-[1344px]">
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
              sizes="(min-width: 1344px) 1344px, 100vw"
              className="object-cover"
            />

            {!playing ? (
              <>
                {/* Figma 436:1970 "shadows": 201.6px scrims top (to 25% black) and bottom (to 50% black, multiply). */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[201.6px] bg-gradient-to-b from-black/25 to-transparent"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[201.6px] bg-gradient-to-b from-transparent to-black/50 mix-blend-multiply"
                  aria-hidden="true"
                />
                <p className="pointer-events-none absolute left-4 top-4 max-w-[75%] stretch-90 text-[18px] font-normal leading-[1.3] tracking-[0.01em] text-white sm:left-[33.6px] sm:top-7 sm:max-w-[calc(100%-142px)] sm:text-[29.4px]">
                  {displayHeading}
                </p>
                <PlayerChrome />
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  aria-label={t.playLabel}
                  className="group absolute inset-0 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
                >
                  {/* Mobile has no room for the drawn control bar — keep one clear play target. */}
                  <span className="flex size-16 items-center justify-center rounded-pill bg-white/90 text-ink shadow-card transition-transform duration-standard ease-expo group-hover:scale-105 lg:hidden">
                    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 2.5v11l10-5.5-10-5.5Z" fill="currentColor" />
                    </svg>
                  </span>
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

/**
 * The drawn "video player" chrome from the design (Figma 436:1973 + info icon):
 * timeline, play/next/volume + time on the left, captions/HD/theater/cast/
 * fullscreen on the right. Purely decorative (`aria-hidden`, inert) — the whole
 * poster is the real play button; the actual player takes over once pressed.
 * Hidden below `lg`, where there isn't room to draw it.
 */
function PlayerChrome() {
  const icon = (name: string) => `/images/home/v2/svg/${name}.svg`;
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src={icon('yt-info')}
        alt=""
        className="absolute right-[33.6px] top-[29.4px] size-[42px]"
      />

      <div className="absolute bottom-[75.6px] left-[25.2px] right-[25.2px] h-[6.3px] bg-[rgba(234,234,234,0.2)]" />
      <div className="absolute bottom-[75.6px] left-[0.94%] right-1/2 h-[6.3px] bg-[rgba(234,234,234,0.5)]" />
      <div className="absolute bottom-[75.6px] left-[0.94%] right-[66.25%] h-[6.3px] bg-[#fc0d1c]" />

      <img
        src={icon('yt-play')}
        alt=""
        className="absolute bottom-[21px] left-[60.9px] h-[33.6px] w-[27.3px]"
      />
      <img
        src={icon('yt-next')}
        alt=""
        className="absolute bottom-[25.2px] left-[147px] size-[25.2px]"
      />
      <img
        src={icon('yt-sound')}
        alt=""
        className="absolute bottom-[21px] left-[214.2px] h-[33.6px] w-[27.825px]"
      />
      <span className="absolute bottom-[38.3px] left-[283.5px] w-[116.4px] translate-y-1/2 text-[16.8px] leading-none tracking-[0.168px] text-[#eaeaea]">
        0:30 / 01:30
      </span>

      <img
        src={icon('yt-fullscreen')}
        alt=""
        className="absolute bottom-[21px] right-[46.2px] size-[33.6px]"
      />
      <img
        src={icon('yt-cast')}
        alt=""
        className="absolute bottom-[18.9px] right-[115.5px] h-[37.8px] w-[46.2px]"
      />
      <img
        src={icon('yt-theater')}
        alt=""
        className="absolute bottom-[23.1px] right-[193.2px] h-[29.4px] w-[42px]"
      />
      <img
        src={icon('yt-hd')}
        alt=""
        className="absolute bottom-[21px] right-[262.5px] h-[33.6px] w-[42px]"
      />
      <img
        src={icon('yt-cc')}
        alt=""
        className="absolute bottom-[23.1px] right-[346.5px] h-[29.4px] w-[37.8px]"
      />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
