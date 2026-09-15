'use client';

import Image from 'next/image';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` S3 "Who can join" — Figma's "Dealers" page (node 291:775, file
 * 9Lq4XpWusTJj1VnM6laAZr) with a 5-item list overlaid on the real car photo.
 * `Rectangle 34624655`/`34624664` (the frame's two visible "rectangle"
 * layers) turned out to be plain gradient fills, not the photo itself —
 * the actual image lives one level deeper as an embedded GIF asset
 * (`319c048315d496a7f01e61eac662d0f1 1`, 980×551, under `Group 39467` →
 * `Group 5785`). Figma's own asset panel doesn't offer a still export for
 * an embedded GIF, so this downloads the GIF and keeps its first frame
 * (`ffmpeg`/`magick` unavailable → `magick gif[0]`) as a static PNG — the
 * same photo the mockup shows, without shipping a 70MB animated file to
 * every visitor.
 *
 * Figma reuses the S2 heading string verbatim on this section too
 * ("Ինչո՞ւ դառնալ գործընկեր") — a known copy-paste duplication in this
 * Figma file (see `AuctionFollowAlong`/USA-import-process precedent this
 * session), reproduced faithfully rather than "corrected" to a different
 * heading Figma doesn't actually show.
 *
 * The list itself (5 items) is trusted over `references/pages.md` §5 S3's
 * older 8-item version — Figma is the more current design here.
 */
export function PartnersWhoCanJoin() {
  const t = useMessages().partners.whoCanJoin;

  return (
    <section className="bg-surface-light px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="mx-auto max-w-container">
        <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>
        <div className="relative mt-10 h-[300px] overflow-hidden rounded-[32px] sm:h-[420px] lg:h-[551px]">
          <Image src="/images/partners/who-can-join.png" alt="" fill className="object-cover" />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"
            aria-hidden="true"
          />
          <ul className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col justify-center gap-3 px-6 py-6 sm:max-w-sm sm:px-10">
            {t.items.map((item) => (
              <li key={item} className="text-home-label font-normal text-white">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
