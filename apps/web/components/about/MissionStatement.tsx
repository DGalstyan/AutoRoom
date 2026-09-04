'use client';

import { useEffect, useRef, useState } from 'react';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * About S2 "Who We Are" — full-screen centered text that "burns in"
 * word-by-word on scroll (`references/pages.md` "6. About" S2). Figma node
 * `123:335` (file `9Lq4XpWusTJj1VnM6laAZr`, re-confirmed directly in Figma's
 * Dev Mode inspector this pass — a `Text` component instance, 1344×280,
 * 110px vertical / 48px horizontal padding, sitting on the page's dark
 * band): large centered gray statement that burns white on scroll.
 *
 * No scroll-animation library is installed in this project yet
 * (`framer-motion` isn't a dependency) — a plain `IntersectionObserver`
 * toggling one class on the section, with each word's reveal staggered by
 * a CSS `transition-delay` derived from its own index, gets the same effect
 * without adding one for a single section. Reduced-motion respects the
 * site-wide contract: words are already visible immediately then, no delay.
 */
export function MissionStatement() {
  const t = useMessages().about;
  const words = t.mission.split(' ');
  const sectionRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Deferred a tick so this isn't a synchronous setState-in-effect (the
      // words start hidden either way; reduced-motion just skips the
      // IntersectionObserver wait and reveals them right after mount).
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
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-[500px] items-center bg-ink px-6 py-24 sm:px-12">
      <p className="mx-auto max-w-4xl text-center font-display text-[36px] font-semibold leading-[56px] text-neutral-700">
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="inline-block transition-colors duration-500 ease-expo"
            style={{
              transitionDelay: `${index * 30}ms`,
              color: revealed ? '#ffffff' : undefined,
            }}
          >
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </section>
  );
}
