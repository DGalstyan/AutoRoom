import { LoadingImage } from '@/components/ui/LoadingImage';
import { Reveal } from '@/components/ui/Reveal';
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
 * three-row rhythm (wide-first pair, plain triple, wide-second pair) for as
 * many images as exist, rather than hardcoding 7 slots. A trailing partial
 * row still renders, and its photos stretch across the row (see `spanClass`) so no cell is left empty.
 */
const ROW_CYCLE = [
  // Figma 123:416: [wide, narrow] → [narrow ×3] → [narrow, wide].
  { wideIndex: 0, size: 2 },
  { wideIndex: null, size: 3 },
  { wideIndex: 1, size: 2 },
] as const;

export function PhotoGallery({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const rows = chunkIntoRows(sorted);

  return (
    <>
      {/* Phones: one swipeable strip instead of a page-long stack of full-width photos. */}
      <ul
        aria-label="AutoRoom"
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
      >
        {sorted.map((image, index) => (
          <li key={image.id} className="w-[78%] shrink-0 snap-center">
            <Tile src={image.imageUrl} n={index + 1} />
          </li>
        ))}
      </ul>

      <div className="hidden flex-col gap-4 sm:flex lg:gap-6">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-x-[26px] lg:gap-y-6"
          >
            {row.images.map((image, tileIndex) => (
              <Reveal
                key={image.id}
                delayMs={tileIndex * 100}
                className={spanClass(row, tileIndex)}
              >
                <Tile src={image.imageUrl} n={sorted.indexOf(image) + 1} />
              </Reveal>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Column span of a tile in the 3-column grid. A full row follows the Figma rhythm; a short last row (the admin's
 * count is not a multiple of the cycle) stretches to the full width instead of leaving an empty cell.
 */
function spanClass(row: { wideIndex: number | null; images: GalleryImage[] }, tileIndex: number) {
  const count = row.images.length;
  if (count === 1) return 'sm:col-span-3';
  if (count === 2 && row.wideIndex === null) return tileIndex === 0 ? 'sm:col-span-2' : undefined;
  return tileIndex === row.wideIndex ? 'sm:col-span-2' : undefined;
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

function Tile({ src, n, className = '' }: { src: string; n: number; className?: string }) {
  return (
    <div
      className={`group relative h-[240px] w-full overflow-hidden rounded-[32px] sm:h-[300px] lg:h-[480px] ${className}`}
    >
      <LoadingImage
        src={src}
        // Uploaded photos carry no caption, so name the brand and the picture's place in the set.
        alt={`AutoRoom ${n}`}
        sizes="(min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-expo group-hover:scale-105"
      />
    </div>
  );
}
