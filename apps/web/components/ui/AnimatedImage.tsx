'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animated WebP (converted from the design's GIFs — ~1–5 MB instead of 28–70 MB)
 * layered over an instant static poster.
 *
 *  - The poster paints immediately (and is the only thing shown to visitors who
 *    prefer reduced motion or have data-saver on), so LCP never waits on the
 *    animation.
 *  - The animation fades in over the poster once it has loaded.
 *  - `lazy` defers even *requesting* the animation until the block is near the
 *    viewport — used for the heavier below-the-fold animations.
 */
export function AnimatedImage({
  src,
  poster,
  alt = '',
  className = '',
  imgClassName = 'object-cover',
  lazy = false,
  priority = false,
}: {
  src: string;
  poster: string;
  alt?: string;
  /** Classes for the wrapper (sizing/rounding). The wrapper is `relative overflow-hidden`. */
  className?: string;
  /** Classes applied to both images (object-fit/position). */
  imgClassName?: string;
  lazy?: boolean;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [near, setNear] = useState(!lazy);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    // Deferred a tick so this isn't a synchronous setState-in-effect.
    queueMicrotask(() => setAllowed(!reduce && !saveData));
  }, []);

  useEffect(() => {
    if (!lazy) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy]);

  const imgBase = `absolute inset-0 h-full w-full ${imgClassName}`;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={alt}
        className={imgBase}
        fetchPriority={priority ? 'high' : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
      />
      {allowed && near && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden="true"
          onLoad={() => setLoaded(true)}
          className={`${imgBase} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
