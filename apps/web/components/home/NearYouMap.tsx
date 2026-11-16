'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { WORLD_MAP_DOTS, WORLD_MAP_DOT_BOX, WORLD_MAP_SIZE } from '@/lib/data/worldMapDots';

/** The prototype's `Component 3` dot: lights up on hover, then fades back by itself. */
const LIT_MS = 800; // Figma: AFTER_TIMEOUT 0.8s on the lit variant

/**
 * "Միշտ քո կողքին" — Figma 485:5134 (Map, 1440×961). A black full-bleed block: the 44px light white heading, then
 * the flat 1178×711 dotted world map with gold arcs from the «Հայաստան» pin, 64px below it and 64px above the
 * bottom edge. No branch list or button — the design has only the map. The artwork is Figma's own export of the
 * `World Map` frame (485:5139).
 *
 * The map's ~1,057 dots are interactive in the prototype (`Component 3`, a two-variant set): pointer enters a dot →
 * it turns solid gold and grows from 16 to 20 (here 11.2 → 14px) over 0.3s ease-in; 0.8s later it eases back over
 * 0.9s. An overlay of the same dots, at Figma's exact positions, does that on top of the picture; reduced-motion
 * visitors get the still map.
 */
export function NearYouMap({ heading }: { heading: string }) {
  const timers = useRef(new Map<Element, number>());

  // Pending fade-backs must not fire after the section unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };
  }, []);

  const light = (event: React.PointerEvent<SVGSVGElement>) => {
    const dot = event.target as Element;
    if (!(dot instanceof SVGCircleElement)) return;
    dot.classList.add('lit');
    const previous = timers.current.get(dot);
    if (previous) window.clearTimeout(previous);
    timers.current.set(
      dot,
      window.setTimeout(() => {
        dot.classList.remove('lit');
        timers.current.delete(dot);
      }, LIT_MS),
    );
  };

  const { width, height } = WORLD_MAP_SIZE;
  const r = WORLD_MAP_DOT_BOX / 2;
  const dots: { x: number; y: number }[] = [];
  for (let i = 0; i < WORLD_MAP_DOTS.length; i += 2) {
    dots.push({ x: WORLD_MAP_DOTS[i], y: WORLD_MAP_DOTS[i + 1] });
  }

  return (
    <section className="bg-black text-white">
      <div className="mx-auto flex max-w-page flex-col items-center gap-10 px-4 py-12 sm:px-6 lg:gap-16 lg:px-12 lg:py-16">
        <h2 className="type-h2 text-center">{heading}</h2>
        <div className="relative w-full max-w-[1178px]" style={{ aspectRatio: `${width}/712` }}>
          <Image
            src="/images/home/v2/world-map.webp"
            alt=""
            width={1178}
            height={712}
            sizes="(min-width: 1280px) 1178px, 100vw"
            className="h-auto w-full"
          />
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="world-map-dots absolute inset-0 size-full motion-reduce:hidden"
            aria-hidden="true"
            onPointerOver={light}
          >
            {dots.map((dot, index) => (
              <circle key={index} cx={dot.x} cy={dot.y} r={r} />
            ))}
          </svg>
        </div>
      </div>
      <style>{`
        .world-map-dots circle {
          fill: #c8a24a;
          opacity: 0;
          transform: scale(0.8);
          transform-box: fill-box;
          transform-origin: center;
          transition: opacity 0.9s ease-in, transform 0.9s ease-in;
        }
        .world-map-dots circle.lit {
          opacity: 1;
          transform: scale(1);
          transition-duration: 0.3s;
        }
      `}</style>
    </section>
  );
}
