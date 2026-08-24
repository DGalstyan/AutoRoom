'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Scroll progress (0–1) of a tall wrapper element as it passes under a sticky
 * pinned viewport — the pattern `CarAnatomy` uses for its exploded-view
 * reveal. rAF-throttled + passive listener so it never becomes a re-render
 * storm on scroll.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  options: { disabled?: boolean } = {},
): number {
  const { disabled = false } = options;
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (disabled) return;
    const node = ref.current;
    if (!node) return;

    function measure() {
      frame.current = null;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(rect.top <= 0 ? 1 : 0);
        return;
      }
      const raw = -rect.top / scrollable;
      setProgress(Math.min(1, Math.max(0, raw)));
    }

    function onScroll() {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref identity is stable
  }, [disabled]);

  return disabled ? 1 : progress;
}
