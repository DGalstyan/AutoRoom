'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A stat like "10+", "98%" or "100%" that counts up from 0 the first time it
 * scrolls into view. Only the leading digits animate (the "+", "%" or any
 * trailing text stays as authored), the final text is always exactly `value`,
 * and visitors who prefer reduced motion get it straight away. Server markup
 * renders the final value so crawlers and no-JS visitors see the real number.
 */
export function CountUp({ value, durationMs = 1400 }: { value: string; durationMs?: number }) {
  const match = /^(\D*)(\d[\d,]*)(.*)$/.exec(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  const target = match ? Number(match[2].replace(/,/g, '')) : 0;

  useEffect(() => {
    const node = ref.current;
    if (!node || !match) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          setShown(Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) frame = requestAnimationFrame(tick);
          else setShown(null);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // `match` is derived from `value`; depending on value/target is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, target, durationMs]);

  if (!match) return <>{value}</>;
  const [, prefix, digits, suffix] = match;
  const text = shown === null ? digits : shown.toLocaleString('en-US');

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
