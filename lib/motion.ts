'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

/**
 * Motion primitives for the scroll-driven surfaces (`PriceJourney` now,
 * `CarAnatomy` and the USA `Scrollytelling` in later phases).
 *
 * Every one of them is required to have a still fallback, so each hook here has
 * a defined "reduced motion" behaviour rather than leaving it to the component.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Live `prefers-reduced-motion` state. Re-renders if the user changes it.
 *
 * The media query is an external store, so it is read through
 * `useSyncExternalStore` rather than mirrored into state by an effect — that
 * keeps the value correct on the very first client render instead of after a
 * second pass. The server snapshot is "no preference"; the reduced-motion path
 * is always a simplification of the same layout, never a different one.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/**
 * How far an element has travelled through the viewport, 0 → 1.
 *
 * 0 while the element is still below the fold, 1 once it has scrolled well
 * past the middle. Reads are throttled to one per animation frame, so a fast
 * scroll costs one layout read per frame rather than one per scroll event.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function measure() {
      frame.current = null;
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;
      // Starts filling when the top of the section reaches 85% of the viewport,
      // finishes a little before the section leaves it.
      const span = rect.height + viewport * 0.6;
      const travelled = viewport * 0.85 - rect.top;
      setProgress(Math.min(1, Math.max(0, travelled / span)));
    }

    function onScroll() {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [ref]);

  return progress;
}

/**
 * Eases a displayed number toward `target` — the "summing counter" on
 * `PriceJourney`. Returns `target` unchanged when motion is reduced.
 */
export function useCountUp(target: number, duration = 500): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    // Nothing to animate: the hook already returns `target` verbatim below, so
    // only the baseline for a later un-reduced run needs updating.
    if (reduced) {
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    if (from === target) return;

    let frame = 0;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = Math.min(1, (now - start) / duration);
      // easeOutExpo — matches the `ease-expo` timing function used site-wide.
      const eased = elapsed === 1 ? 1 : 1 - Math.pow(2, -10 * elapsed);
      const next = from + (target - from) * eased;
      setValue(next);
      fromRef.current = next;
      if (elapsed < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = target;
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  return reduced ? target : value;
}
