'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * USA photo-card showcase — Figma "Component 3" (440:4091, a 1440×968 black
 * band; its source "Variant2" is 440:3042). Seven rounded-48 photo cards with a
 * translucent play disc each. Figma only exports the *start* pose: one 21×14
 * card dead centre, three cards parked above the frame (y −432/−289/−261) and
 * three below it (y 983/998/1151). The end pose isn't in the file (the other
 * variant isn't reachable), so the resting mosaic below is composed from the
 * same card sizes: top row, a grown centre card, bottom row.
 *
 * Scroll-driven: the band is a tall wrapper with a sticky 968px stage, and the
 * cards ease from the start pose to the mosaic as it scrolls through. Cards sit
 * at fixed 1440-canvas coordinates, scaled to the viewport width. Below `lg`
 * (and with reduced motion) the final pose is shown statically as a grid.
 */
const W = 1440;
const H = 968;

interface Pose {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CardSpec {
  photo: number;
  from: Pose;
  to: Pose;
  /** Scroll-progress window (0–1) the card moves in — staggers the arrival. */
  start: number;
  end: number;
}

const CARDS: CardSpec[] = [
  // centre card: tiny → the middle of the mosaic
  {
    photo: 1,
    from: { x: 709.56, y: 477, w: 20.879, h: 14 },
    to: { x: 547, y: 368, w: 346, h: 232 },
    start: 0,
    end: 0.55,
  },
  // the three parked above the frame
  {
    photo: 1,
    from: { x: 532.1, y: -432, w: 410.129, h: 265 },
    to: { x: 515, y: 70, w: 410, h: 265 },
    start: 0.1,
    end: 0.7,
  },
  {
    photo: 2,
    from: { x: 1022, y: -261, w: 346, h: 222 },
    to: { x: 1022, y: 120, w: 346, h: 222 },
    start: 0.15,
    end: 0.75,
  },
  {
    photo: 3,
    from: { x: 93, y: -289, w: 393.724, h: 254 },
    to: { x: 93, y: 100, w: 394, h: 254 },
    start: 0.05,
    end: 0.65,
  },
  // the three parked below it
  {
    photo: 4,
    from: { x: 1010, y: 998, w: 435.483, h: 292 },
    to: { x: 961, y: 630, w: 435, h: 292 },
    start: 0.2,
    end: 0.8,
  },
  {
    photo: 4,
    from: { x: 598, y: 1151, w: 346, h: 232 },
    to: { x: 598, y: 650, w: 346, h: 232 },
    start: 0.25,
    end: 0.85,
  },
  {
    photo: 5,
    from: { x: 183, y: 983, w: 346, h: 232 },
    to: { x: 183, y: 640, w: 346, h: 232 },
    start: 0.3,
    end: 0.9,
  },
];

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function Card({ photo, pose, className = '' }: { photo: number; pose?: Pose; className?: string }) {
  return (
    <div
      className={`absolute overflow-hidden rounded-[48px] bg-white ${className}`}
      style={
        pose
          ? { left: pose.x, top: pose.y, width: pose.w, height: pose.h, borderRadius: 48 }
          : undefined
      }
    >
      <Image
        src={`/images/usa/showcase/photo-${photo}.webp`}
        alt=""
        fill
        sizes="440px"
        className="object-cover object-[50%_18%]"
      />
      {/* Figma's play disc: 78px on the 410px card ⇒ 19% of the card width. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/usa/showcase/play-a.svg"
        alt=""
        className="absolute left-1/2 top-1/2 aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}

export function UsaShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1024px)');
    let frame = 0;

    const update = () => {
      frame = 0;
      const node = wrapRef.current;
      if (!node) return;
      const on = desktop.matches && !reduce.matches;
      setAnimated(on);
      setScale(Math.min(1, window.innerWidth / W));
      if (!on) {
        setProgress(1);
        return;
      }
      const rect = node.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      setProgress(clamp(travel > 0 ? -rect.top / travel : 1));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const stageHeight = Math.round(H * scale);

  return (
    <section aria-hidden="true" className="bg-black">
      {/* Below lg / reduced motion: the resting mosaic as a plain grid. */}
      {!animated && (
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-3 px-4 py-14 sm:px-6 lg:hidden">
          {[1, 2, 3, 4, 5, 4].map((photo, index) => (
            <div key={index} className="relative aspect-[346/232]">
              <Card photo={photo} className="inset-0 !rounded-[24px]" />
            </div>
          ))}
        </div>
      )}

      <div
        ref={wrapRef}
        className="hidden lg:block"
        style={{ height: animated ? `calc(${stageHeight}px + 140vh)` : stageHeight }}
      >
        <div
          className="sticky top-0 flex items-center justify-center overflow-hidden"
          style={{ height: animated ? '100vh' : stageHeight }}
        >
          <div className="relative" style={{ width: W * scale, height: stageHeight }}>
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{ width: W, height: H, transform: `scale(${scale})` }}
            >
              {CARDS.map((card, index) => {
                const t = easeOut(clamp((progress - card.start) / (card.end - card.start)));
                const pose: Pose = {
                  x: lerp(card.from.x, card.to.x, t),
                  y: lerp(card.from.y, card.to.y, t),
                  w: lerp(card.from.w, card.to.w, t),
                  h: lerp(card.from.h, card.to.h, t),
                };
                return <Card key={index} photo={card.photo} pose={pose} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
