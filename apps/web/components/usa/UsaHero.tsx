'use client';

import Image from 'next/image';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * USA `/usa` S1 — full-bleed photo hero, mirroring the Homepage hero's own
 * image+scrim treatment (`app/page.tsx`'s S1) rather than Figma's video
 * background (node 218:177's `ezgif-...` layer): that asset is stock/demo
 * footage (a laptop closeup, an unrelated auction-site screenshot) baked
 * into a single GIF with no matching real project video to swap in, so a
 * real project photo already in use elsewhere on the site
 * (`direction-usa.webp`, the Homepage direction card's own USA image) reads
 * as a real hero rather than a placeholder.
 *
 * The scrim and fade ARE pixel-matched though (verified via the Dev Mode
 * Code panel on node 218:223's two overlay rectangles, which don't depend
 * on the video underneath them): `opacity:0.5; background:#000;
 * backdrop-filter:blur(21px)` — identical to the Homepage hero's own
 * `bg-black/50 backdrop-blur-[21px]` — and a bottom fade,
 * `linear-gradient(183deg, #151310 7.71%, #F7F7F7 52.66%)` blurred 25px,
 * the same "photo fades to the page's own background" move Homepage's hero
 * makes (there with `#6B5D4E`→`surface-light`), just with this page's own
 * dark tone in place of that one's tan. `-bottom-6`/`+24px` on the fade
 * mirrors Homepage's own fix for the seam a plain `bottom-0` clip leaves
 * (see `app/page.tsx`'s matching comment).
 *
 * The heading itself is Figma's real "Headings/H1-Bold Mid" style — 36px/
 * 56px, centered, `max-w-[1026px]` — exactly `home-hero` plus centering,
 * so it reuses that token rather than a new one.
 *
 * Figma's own USA page has no separate hero subtext or CTA button layers —
 * just the heading over the video — but every other hero on the site pairs
 * its heading with a lead-capture button (`ComingSoonHero`'s established
 * pattern, which this component replaces for `/usa` now that the rest of
 * the page is real content, not a placeholder), so the button stays: the
 * global `StickyCta` alone shouldn't be the only lead path this far above
 * the fold on a page whose whole point is capturing USA-car leads. Centered
 * to match the heading above it, since Figma gives no reason to break the
 * column's alignment partway down.
 */
export function UsaHero() {
  const t = useMessages().usa.hero;
  const { openUniversal } = useLeadWidgets();

  return (
    <section className="relative isolate overflow-hidden bg-bg px-4 pb-14 pt-32 text-white sm:px-6 sm:pb-24 sm:pt-40">
      <Image
        src="/images/home/direction-usa.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[21px]" aria-hidden="true" />
      <div
        className="absolute inset-x-0 -bottom-6 h-[calc(37%+24px)] bg-gradient-to-b from-[#151310] to-surface-light blur-[25px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-container text-center">
        <h1 className="mx-auto max-w-[1026px] animate-fade-up font-display text-home-hero font-bold text-white motion-reduce:animate-none">
          {t.h1}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lead text-white/70 [animation-delay:100ms] motion-reduce:animate-none">
          {t.text}
        </p>
        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'usa-hero', preselect: { interest: 'usa' } })}
          className="mt-10 inline-flex min-h-11 animate-fade-up items-center gap-1 rounded-pill bg-accent px-7 py-4 text-home-label font-normal text-ink transition-colors duration-standard ease-expo [animation-delay:150ms] hover:bg-accent-600 motion-reduce:animate-none"
        >
          {t.cta} <ArrowUpRightIcon />
        </button>
      </div>
    </section>
  );
}
