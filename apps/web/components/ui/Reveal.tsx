'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Shared scroll-triggered entrance: children start faded/lowered and rise
 * into place the first time they cross into the viewport. No scroll-
 * animation library is installed in this project (`framer-motion` isn't a
 * dependency — see `MissionStatement.tsx`'s own note) — a plain
 * `IntersectionObserver` toggling one class, same technique, generalized
 * into a reusable wrapper instead of duplicating the boilerplate per
 * section. `prefers-reduced-motion` skips the observer/delay entirely and
 * renders children fully visible right away.
 */
export function Reveal({
  children,
  className = '',
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger multiple `Reveal`s in the same section (e.g. index * 100). */
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Deferred a tick so this isn't a synchronous setState-in-effect.
      queueMicrotask(() => setRevealed(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-expo ${
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
