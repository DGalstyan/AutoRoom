'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
 * Details / Video) with a horizontally-scrollable thumbnail strip, per
 * `references/pages.md` and Figma node 102:485/102:487 — a white pill filter
 * bar (active = solid `neutral-700`, not the darker fill used elsewhere on
 * the page) and a thumbnail row where the current image gets a solid border
 * rather than a dimmed/highlighted opacity treatment; a right-edge fade +
 * arrow (node 102:505/102:189) hints there's more to scroll to when the
 * strip overflows. `colorImageUrl` is the order-only `ColorPicker`'s current
 * selection: it takes over the hero image until the visitor deliberately
 * picks a tab/thumbnail, at which point manual browsing wins.
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
  const [canScrollMore, setCanScrollMore] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const albumImages = useMemo(
    () => images.filter((image) => image.album === selectedAlbum),
    [images, selectedAlbum],
  );
  const activeImage = albumImages[activeIndex] ?? albumImages[0];

  function updateScrollAffordance() {
    const node = stripRef.current;
    if (!node) return;
    setCanScrollMore(node.scrollWidth - node.scrollLeft - node.clientWidth > 4);
  }

  useEffect(() => {
    updateScrollAffordance();
  }, [albumImages.length]);

  function selectAlbum(album: ImageAlbum) {
    setSelectedAlbum(album);
    setActiveIndex(0);
    setManualOverride(true);
  }

  function selectThumbnail(index: number) {
    setActiveIndex(index);
    setManualOverride(true);
  }

  function scrollStripRight() {
    stripRef.current?.scrollBy({ left: 166, behavior: 'smooth' });
  }

  const showColorOverride = Boolean(colorImageUrl) && !manualOverride;
  const isVideo = selectedAlbum === 'VIDEO' && !showColorOverride;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-[1920/1080] w-full overflow-hidden rounded-xl bg-neutral-800">
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

      <div className="flex flex-col gap-6">
        {albums.length > 0 && (
          <div className="flex w-fit items-center gap-3 rounded-pill bg-white px-4 py-3">
            {albums.map((album) => (
              <button
                key={album}
                type="button"
                onClick={() => selectAlbum(album)}
                className={`rounded-[52px] px-4 py-2 text-[16px] leading-[24px] transition-colors duration-standard ${
                  selectedAlbum === album && !showColorOverride
                    ? 'bg-neutral-700 font-medium text-white'
                    : 'text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                {ALBUM_LABELS[album]}
              </button>
            ))}
          </div>
        )}

        {albumImages.length > 1 && selectedAlbum !== 'VIDEO' && (
          <div className="relative">
            <div
              ref={stripRef}
              onScroll={updateScrollAffordance}
              className="flex h-[86px] items-center gap-3 overflow-x-auto"
            >
              {albumImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => selectThumbnail(index)}
                  className={`relative h-[86px] w-[154px] shrink-0 overflow-hidden rounded-[16px] bg-neutral-800 ${
                    !showColorOverride && index === activeIndex
                      ? 'border-[3px] border-neutral-900'
                      : ''
                  }`}
                >
                  <Image src={image.url} alt="" fill sizes="170px" className="object-cover" />
                </button>
              ))}
            </div>
            {canScrollMore && (
              <button
                type="button"
                onClick={scrollStripRight}
                aria-label="Scroll thumbnails"
                className="absolute right-0 top-0 flex h-[86px] w-[170px] items-center justify-center bg-gradient-to-r from-surface-light/0 to-surface-light to-[91%]"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-white text-neutral-800 shadow-card">
                  <ArrowRightGlyph />
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowRightGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
