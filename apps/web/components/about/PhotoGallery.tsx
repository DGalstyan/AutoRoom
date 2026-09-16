import Image from 'next/image';
import type { GalleryImage } from '@/lib/gallery';

/**
 * About S4's photo collage (`references/pages.md` "6. About" S4: "a photo
 * collage grid — one full-width + two medium — mixing photos + short video
 * clips"). Figma node `123:380` (file `9Lq4XpWusTJj1VnM6laAZr`, this pass's
 * Dev Mode pixel-audit confirmed the [wide, narrow] / [narrow, wide] /
 * [narrow, narrow, narrow] row rhythm).
 *
 * Fully admin-managed (apps/admin's Gallery screen, `Lead`-style CRUD over
 * `GalleryImage`) — only real uploaded photos render, sorted by `position`.
 * No bundled placeholder photos: same "render nothing until an admin fills
 * it in" contract as `TeamSection`, right above this in the same S4 block.
 *
 * The original Figma design assumed exactly 7 photos in 3 fixed rows; an
 * admin-managed gallery can hold any count, so `ROW_CYCLE` repeats that same
 * three-row rhythm (wide-first pair, wide-second pair, plain triple) for as
 * many images as exist, rather than hardcoding 7 slots. A trailing partial
 * row (e.g. a wide-first row with only one photo left) still renders — it
 * just leaves the row's other cell empty instead of forcing a fourth shape.
 */
const ROW_CYCLE = [
  { wideIndex: 0, size: 2 },
  { wideIndex: 1, size: 2 },
  { wideIndex: null, size: 3 },
] as const;

export function PhotoGallery({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const rows = chunkIntoRows(sorted);

  return (
    <div className="flex flex-col gap-6">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {row.images.map((image, tileIndex) => (
            <Tile
              key={image.id}
              src={image.imageUrl}
              className={tileIndex === row.wideIndex ? 'sm:col-span-2' : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function chunkIntoRows(images: GalleryImage[]) {
  const rows: { wideIndex: number | null; images: GalleryImage[] }[] = [];
  for (let index = 0; index < images.length;) {
    const pattern = ROW_CYCLE[rows.length % ROW_CYCLE.length];
    rows.push({ wideIndex: pattern.wideIndex, images: images.slice(index, index + pattern.size) });
    index += pattern.size;
  }
  return rows;
}

function Tile({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`relative aspect-[887/480] w-full overflow-hidden rounded-[32px] ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 640px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}
