import Image from 'next/image';

/**
 * About S4's photo collage (`references/pages.md` "6. About" S4: "a photo
 * collage grid — one full-width + two medium — mixing photos + short video
 * clips"). Figma node `123:380` (file `9Lq4XpWusTJj1VnM6laAZr`, this pass's
 * Dev Mode pixel-audit confirmed the 3-row [wide, narrow] / [narrow, wide] /
 * [narrow, narrow, narrow] layout visually; the 32px radius / 24px gaps
 * below are carried over from the prior pass rather than re-measured node
 * by node — flag for a follow-up if they drift from the real values).
 *
 * Figma's own photos here are generic stock office/team shots (unrelated to
 * cars or AutoRoom) — not real assets to carry into code. Substituted with
 * existing on-brand photography not already used elsewhere on this same
 * page — `founder-poster.jpg` was here originally but the page now also
 * renders `FounderVideo` (which uses that same still as its poster), so
 * this tile was swapped for `story-1.jpg` to avoid repeating within one
 * scroll. No video clips are available yet — every tile is a still photo.
 */
const TILES = [
  '/images/home/featured-1.jpg',
  '/images/home/featured-2.jpg',
  '/images/home/featured-3.jpg',
  '/images/home/hero-desert.jpg',
  '/images/home/featured-4.jpg',
  '/images/home/ecosystem-strip.jpg',
  '/images/home/story-1.jpg',
] as const;

export function PhotoGallery() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Tile src={TILES[0]} className="sm:col-span-2" />
        <Tile src={TILES[1]} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Tile src={TILES[2]} />
        <Tile src={TILES[3]} className="sm:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Tile src={TILES[4]} />
        <Tile src={TILES[5]} />
        <Tile src={TILES[6]} />
      </div>
    </div>
  );
}

function Tile({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`relative aspect-[887/480] w-full overflow-hidden rounded-[32px] ${className}`}>
      <Image src={src} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
    </div>
  );
}
