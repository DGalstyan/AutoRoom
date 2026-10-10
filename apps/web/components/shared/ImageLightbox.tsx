'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useMessages } from '@/components/shared/LocaleProvider';
import { interpolate } from '@/lib/messages';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const STEP = 0.5;

interface Pan {
  x: number;
  y: number;
}

/**
 * Full-screen photo viewer with zoom: buttons, wheel, double-click/tap, `+`/`-`/`0` keys,
 * drag to pan while zoomed, ←/→ to move between photos, Esc to close. Focus-trapped and
 * `aria-modal`; page scroll is locked while it is open.
 */
export function ImageLightbox({
  images,
  index,
  alt,
  onIndexChange,
  onClose,
}: {
  images: { url: string }[];
  index: number;
  alt: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const t = useMessages().common.carDetail.gallery;
  const closeLabel = useMessages().common.popup.close;
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true, onClose);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; pan: Pan } | null>(null);
  const [dragging, setDragging] = useState(false);

  const image = images[index];

  const reset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomTo = useCallback((next: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    setScale(clamped);
    if (clamped === MIN_SCALE) setPan({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      reset();
      onIndexChange((index + delta + images.length) % images.length);
    },
    [images.length, index, onIndexChange, reset],
  );

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'ArrowRight') go(1);
      else if (event.key === '+' || event.key === '=') zoomTo(scale + STEP);
      else if (event.key === '-') zoomTo(scale - STEP);
      else if (event.key === '0') reset();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, reset, scale, zoomTo]);

  function onWheel(event: WheelEvent) {
    // The page is scroll-locked while the viewer is open, so there is nothing to prevent here.
    zoomTo(scale + (event.deltaY < 0 ? STEP : -STEP));
  }

  function onPointerDown(event: PointerEvent) {
    if (scale === MIN_SCALE) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, pan };
    setDragging(true);
  }
  function onPointerMove(event: PointerEvent) {
    if (!drag.current) return;
    setPan({
      x: drag.current.pan.x + event.clientX - drag.current.x,
      y: drag.current.pan.y + event.clientY - drag.current.y,
    });
  }
  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  if (!image) return null;

  const button =
    'flex size-11 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-card transition-colors duration-standard hover:bg-white disabled:opacity-40';

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.lightbox}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 p-3 sm:p-4">
        <span className="rounded-pill bg-white/10 px-3 py-1 text-[14px] tabular-nums text-white">
          {interpolate(t.counter, { n: String(index + 1), total: String(images.length) })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={button}
            onClick={() => zoomTo(scale - STEP)}
            disabled={scale <= MIN_SCALE}
            aria-label={t.zoomOut}
          >
            <span aria-hidden="true" className="text-[22px] leading-none">
              −
            </span>
          </button>
          <button
            type="button"
            className={button}
            onClick={() => zoomTo(scale + STEP)}
            disabled={scale >= MAX_SCALE}
            aria-label={t.zoomIn}
          >
            <span aria-hidden="true" className="text-[22px] leading-none">
              +
            </span>
          </button>
          <button
            type="button"
            className={button}
            onClick={reset}
            disabled={scale === MIN_SCALE}
            aria-label={t.zoomReset}
          >
            <span aria-hidden="true" className="text-[13px] font-bold">
              1:1
            </span>
          </button>
          <button type="button" className={button} onClick={onClose} aria-label={closeLabel}>
            <span aria-hidden="true" className="text-[22px] leading-none">
              ×
            </span>
          </button>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => (scale === MIN_SCALE ? zoomTo(2.5) : reset())}
        style={{ cursor: scale > MIN_SCALE ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={alt}
          draggable={false}
          className="absolute inset-0 m-auto max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: dragging ? 'none' : 'transform 150ms ease-out',
          }}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              className={`${button} absolute left-3 top-1/2 -translate-y-1/2`}
              onClick={() => go(-1)}
              aria-label={t.previous}
            >
              <span aria-hidden="true" className="rotate-180 text-[18px]">
                ›
              </span>
            </button>
            <button
              type="button"
              className={`${button} absolute right-3 top-1/2 -translate-y-1/2`}
              onClick={() => go(1)}
              aria-label={t.next}
            >
              <span aria-hidden="true" className="text-[18px]">
                ›
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
