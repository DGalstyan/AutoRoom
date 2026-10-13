'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Scroll-driven rise: the children start `distance`px below their place and glide up as the
 * wrapper scrolls from the bottom of the viewport to the top, settling exactly in place when
 * its top edge reaches the top of the screen (the China "Services" band, Figma 438:844, where
 * the card grid enters from the bottom of a black frame). Only from `minWidth` up; below that,
 * and with reduced motion, nothing moves and the content is simply there. Server-rendered
 * content is never offset, so it is visible without JavaScript.
 */
export function ScrollRise({
  children,
  distance = 600,
  minWidth = 1024,
  settleAt = 0,
  className = '',
}: {
  children: ReactNode;
  distance?: number;
  minWidth?: number;
  /** How far inside its section the wrapper sits (the section's top padding). */
  settleAt?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reduced.matches || window.innerWidth < minWidth) {
        node.style.transform = '';
        return;
      }
      const top = node.getBoundingClientRect().top;
      // The wrapper's own offset is part of what we measure, so undo it before computing progress.
      const current = Number(node.dataset.offset ?? 0);
      const naturalTop = top - current;
      // Settled once the section's top edge (the wrapper sits `settleAt`px inside it) is at the screen top.
      const progress = Math.min(Math.max(1 - (naturalTop - settleAt) / window.innerHeight, 0), 1);
      const offset = Math.round(distance * (1 - progress));
      node.dataset.offset = String(offset);
      node.style.transform = offset ? `translate3d(0, ${offset}px, 0)` : '';
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [distance, minWidth, settleAt]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
