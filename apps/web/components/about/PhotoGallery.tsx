import Image from 'next/image';
import type { GalleryImage } from '@/lib/gallery';

/**
 * About S4's photo collage (`references/pages.md` "6. About" S4: "a photo
 * collage grid — one full-width + two medium — mixing photos + short video
 * clips"). Figma node `123:380` (file `9Lq4XpWusTJj1VnM6laAZr`).
 *
 * Fully admin-managed (apps/admin's Gallery screen, `Lead`-style CRUD over
 * `GalleryImage`) — only real uploaded photos render, sorted by `position`,
 * in a uniform responsive grid. No bundled placeholder photos and no
 * padding to a fixed tile count: same "render nothing until an admin fills
 * it in" contract as `TeamSection`, right above this in the same S4 block.
 */
export function PhotoGallery({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.position - b.position);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {sorted.map((image) => (
        <Tile key={image.id} src={image.imageUrl} />
      ))}
    </div>
  );
}

function Tile({ src }: { src: string }) {
  return (
    <div className="relative aspect-[887/480] w-full overflow-hidden rounded-[32px]">
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}
