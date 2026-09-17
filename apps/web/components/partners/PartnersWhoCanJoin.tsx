'use client';

import Image from 'next/image';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` S3 "Who can join" — Figma's "Dealers" page (node 291:775,
 * file 9Lq4XpWusTJj1VnM6laAZr) with a 5-item list overlaid on a real car
 * photo. `Rectangle 34624655`/`34624664` (the frame's two visible
 * "rectangle" layers) turned out to be plain gradient fills, not the photo
 * itself — the actual image lives one level deeper as an embedded GIF
 * asset (`319c048315d496a7f01e61eac662d0f1 1`, 980×551, under
 * `Group 39467` → `Group 5785`). Figma's own asset panel doesn't offer a
 * still export for an embedded GIF, so this downloads the GIF and keeps
 * its first frame (`ffmpeg`/`magick` unavailable → `magick gif[0]`) as a
 * static PNG — the same photo the mockup shows, without shipping a 70MB
 * animated file to every visitor.
 *
 * Visual treatment rebuilt to match `ChinaWhyOrder`/the Homepage ecosystem
 * panel's established photo + frosted-glass list card, replacing this
 * component's original bespoke dark-gradient overlay — per explicit user
 * feedback that the page's "why"-shaped sections should read as the same
 * component used elsewhere on the site, not a one-off. See `PartnersWhy`
 * (right above this one) for the same change and the same reasoning.
 *
 * Figma reuses the S2 heading string verbatim on this section too
 * ("Ինչո՞ւ դառնալ գործընկեր") — a known copy-paste duplication in this
 * Figma file (see `AuctionFollowAlong`/USA-import-process precedent this
 * session), reproduced faithfully rather than "corrected" to a different
 * heading Figma doesn't actually show.
 *
 * The list is 8 items, matching `references/pages.md` §5 S3's original
 * count — an earlier pass here had trimmed it to 5 and dropped one entry
 * that isn't in Figma at all ("Ավտովարձույթներ"/car rental companies),
 * which was the live-vs-Figma mismatch a later user report caught.
 * Re-verified directly against the live Figma node (291:772) rather than
 * assumed from that stale comment.
 */
export function PartnersWhoCanJoin() {
  const t = useMessages().partners.whoCanJoin;

  return (
    <section className="bg-surface-light px-4 pb-14 sm:px-6 sm:pb-24">
      <div className="mx-auto flex max-w-container flex-col gap-14">
        <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

        <div className="relative overflow-visible rounded-[32px]">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[32px] sm:aspect-[980/551] sm:w-[72.917%]">
            <Image
              src="/images/partners/who-can-join.png"
              alt=""
              fill
              sizes="(min-width: 1024px) 980px, 100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/0 to-[95.372%] to-black/[0.89]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-4 px-4 sm:absolute sm:right-0 sm:top-[16%] sm:mt-0 sm:w-[90%] sm:max-w-[473px] sm:px-0 sm:pr-4">
            <ul className="flex flex-col gap-3 rounded-[32px] bg-white/[0.32] p-8 shadow-card backdrop-blur-md">
              {t.items.map((item) => (
                <li key={item} className="text-home-label font-normal leading-[28px] text-ink">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
