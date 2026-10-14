'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A horizontally scrolling wrapper for wide tables. While more content sits off to the right it
 * shows a soft edge on that side, so a clipped table reads as scrollable instead of broken; the
 * edge goes away once the end is reached or when everything fits.
 */
export function ScrollFade({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className="overflow-x-auto">
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/25 to-transparent transition-opacity duration-standard ${
          more ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
