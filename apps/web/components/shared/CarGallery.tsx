'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { CarImage, ImageAlbum } from '@/lib/types/car';
import { messages } from '@/lib/messages';

const t = messages.china.detail.gallery;

const ALBUM_ORDER: ImageAlbum[] = ['EXTERIOR', 'INTERIOR', 'DETAILS', 'VIDEO'];
const ALBUM_LABELS: Partial<Record<ImageAlbum, string>> = {
  EXTERIOR: t.exterior,
  INTERIOR: t.interior,
  DETAILS: t.details,
  VIDEO: t.video,
};

/**
 * China (and later USA) car-detail S3.2 — image tabs (Exterior / Interior /
 * Details / Video) with a thumbnail strip, per `references/pages.md` and
 * Figma node 102:485. `colorImageUrl` is the order-only `ColorPicker`'s
 * current selection: it takes over the hero image until the visitor
 * deliberately picks a tab/thumbnail, at which point manual browsing wins.
 */
export function CarGallery({
  images,
  colorImageUrl,
  alt,
}: {
  images: CarImage[];
  colorImageUrl?: string | null;
  alt: string;
}) {
  const albums = useMemo(
    () => ALBUM_ORDER.filter((album) => images.some((image) => image.album === album)),
    [images],
  );

  const [selectedAlbum, setSelectedAlbum] = useState<ImageAlbum | undefined>(albums[0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualOverride, setManualOverride] = useState(false);

  const albumImages = useMemo(
    () => images.filter((image) => image.album === selectedAlbum),
    [images, selectedAlbum],
  );
  const activeImage = albumImages[activeIndex] ?? albumImages[0];

  function selectAlbum(album: ImageAlbum) {
    setSelectedAlbum(album);
    setActiveIndex(0);
    setManualOverride(true);
  }

  function selectThumbnail(index: number) {
    setActiveIndex(index);
    setManualOverride(true);
  }

  const showColorOverride = Boolean(colorImageUrl) && !manualOverride;
  const isVideo = selectedAlbum === 'VIDEO' && !showColorOverride;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-[850/478] w-full overflow-hidden rounded-[32px] bg-neutral-800">
        {showColorOverride ? (
          <Image src={colorImageUrl!} alt={alt} fill sizes="850px" className="object-cover" />
        ) : isVideo && activeImage ? (
          <video
            src={activeImage.url}
            controls
            playsInline
            className="h-full w-full object-cover"
          />
        ) : activeImage ? (
          <Image
            src={activeImage.url}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1024px) 850px, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-ink via-surface to-muted/60"
            aria-hidden="true"
          />
        )}
      </div>

      {albums.length > 0 && (
        <div className="flex items-center gap-3 rounded-pill bg-neutral-25 px-4 py-3">
          {albums.map((album) => (
            <button
              key={album}
              type="button"
              onClick={() => selectAlbum(album)}
              className={`rounded-pill px-4 py-2 text-[16px] font-medium leading-[24px] transition-colors duration-standard ${
                selectedAlbum === album && !showColorOverride
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              {ALBUM_LABELS[album]}
            </button>
          ))}
        </div>
      )}

      {albumImages.length > 1 && selectedAlbum !== 'VIDEO' && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {albumImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => selectThumbnail(index)}
              className={`relative aspect-[154/86] overflow-hidden rounded-xl bg-neutral-800 transition-opacity duration-standard ${
                !showColorOverride && index === activeIndex ? '' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={image.url} alt="" fill sizes="170px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
