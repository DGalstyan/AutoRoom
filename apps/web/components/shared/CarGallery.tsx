'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import type { CarImage, ImageAlbum } from '@/lib/types/car';
import { useMessages } from '@/components/shared/LocaleProvider';
import { interpolate } from '@/lib/messages';
import { ImageLightbox } from '@/components/shared/ImageLightbox';

const ALBUM_ORDER: ImageAlbum[] = ['EXTERIOR', 'INTERIOR', 'DETAILS', 'VIDEO'];

/**
 * China/USA car-detail S3.2 — image tabs (Exterior / Interior /
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
  const t = useMessages().common.carDetail.gallery;
  const ALBUM_LABELS: Partial<Record<ImageAlbum, string>> = {
    EXTERIOR: t.exterior,
    INTERIOR: t.interior,
    DETAILS: t.details,
    VIDEO: t.video,
  };

  const albums = useMemo(
    () => ALBUM_ORDER.filter((album) => images.some((image) => image.album === album)),
    [images],
  );

  const [selectedAlbum, setSelectedAlbum] = useState<ImageAlbum | undefined>(albums[0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualOverride, setManualOverride] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
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

  function step(delta: number) {
    if (albumImages.length < 2) return;
    setActiveIndex((current) => (current + delta + albumImages.length) % albumImages.length);
    setManualOverride(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    }
  }

  function scrollStripRight() {
    stripRef.current?.scrollBy({ left: 166, behavior: 'smooth' });
  }

  const showColorOverride = Boolean(colorImageUrl) && !manualOverride;
  const isVideo = selectedAlbum === 'VIDEO' && !showColorOverride;
  const canStep = albumImages.length > 1 && !showColorOverride && !isVideo;
  const albumName = selectedAlbum ? ALBUM_LABELS[selectedAlbum] : undefined;
  const itemLabel = (index: number) =>
    interpolate(selectedAlbum === 'VIDEO' ? t.videoLabel : t.photoLabel, { n: String(index + 1) });

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={t.region}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-6"
    >
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
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label={t.zoom}
            className="absolute inset-0 cursor-zoom-in"
          >
            <Image
              src={activeImage.url}
              alt={`${alt} — ${albumName ?? ''} ${activeIndex + 1}`.replace(/\s+/g, ' ').trim()}
              fill
              priority
              sizes="(min-width: 1024px) 850px, 100vw"
              className="object-cover"
            />
          </button>
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-ink via-surface to-muted/60"
            aria-hidden="true"
          />
        )}

        {activeImage && !isVideo && !showColorOverride && (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label={t.zoom}
            className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-card transition-colors duration-standard hover:bg-white"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="m13 13 4 4M8.5 6v5M6 8.5h5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {canStep && (
          <>
            <StepButton direction="prev" label={t.previous} onClick={() => step(-1)} />
            <StepButton direction="next" label={t.next} onClick={() => step(1)} />
          </>
        )}
        {activeImage && albumImages.length > 1 && !showColorOverride && (
          <span
            aria-live="polite"
            className="absolute bottom-3 right-3 rounded-pill bg-black/60 px-3 py-1 text-[14px] font-medium leading-[20px] text-white tabular-nums"
          >
            {interpolate(t.counter, {
              n: String(activeIndex + 1),
              total: String(albumImages.length),
            })}
          </span>
        )}
      </div>

      {zoomOpen && activeImage && !isVideo && (
        <ImageLightbox
          images={albumImages}
          index={Math.max(0, albumImages.indexOf(activeImage))}
          alt={alt}
          onIndexChange={(next) => {
            setActiveIndex(next);
            setManualOverride(true);
          }}
          onClose={() => setZoomOpen(false)}
        />
      )}

      <div className="flex flex-col gap-6">
        {albums.length > 0 && (
          <div
            role="tablist"
            aria-label={t.albums}
            className="flex w-fit max-w-full flex-wrap items-center gap-3 rounded-pill bg-white px-4 py-3"
          >
            {albums.map((album) => (
              <button
                key={album}
                type="button"
                role="tab"
                aria-selected={selectedAlbum === album && !showColorOverride}
                aria-label={`${ALBUM_LABELS[album]} (${images.filter((image) => image.album === album).length})`}
                onClick={() => selectAlbum(album)}
                className={`rounded-[52px] min-h-11 px-4 py-2 text-[16px] leading-[24px] transition-colors duration-standard ${
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
              className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:flex lg:h-[86px] lg:items-center lg:gap-3 lg:overflow-x-auto"
            >
              {albumImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => selectThumbnail(index)}
                  aria-label={`${albumName ?? ''} ${itemLabel(index)}`.trim()}
                  aria-current={!showColorOverride && index === activeIndex ? 'true' : undefined}
                  className={`relative aspect-[154/86] w-full overflow-hidden rounded-[12px] bg-neutral-800 lg:h-[86px] lg:w-[154px] lg:shrink-0 lg:rounded-[16px] ${
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
                aria-label={t.scrollThumbnails}
                className="absolute right-0 top-0 hidden h-[86px] w-[170px] items-center justify-center bg-gradient-to-r from-surface-light/0 to-surface-light to-[91%] lg:flex"
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

function StepButton({
  direction,
  label,
  onClick,
}: {
  direction: 'prev' | 'next';
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-card transition-colors duration-standard hover:bg-white ${
        direction === 'prev' ? 'left-3' : 'right-3'
      }`}
    >
      <span className={direction === 'prev' ? 'rotate-180' : undefined}>
        <ArrowRightGlyph />
      </span>
    </button>
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
