'use client';

import Image from 'next/image';
import { useId, useState } from 'react';
import { messages } from '@/lib/messages';

const t = messages.home.anatomy;

/**
 * "Ինչո՞ւ ընտրել AutoRoom-ը" — Figma's actual Homepage treatment (node
 * `9321:6155`) is a single static hero photo with a few connector-line
 * hotspot labels plus a 4-stat column, not the full scroll-driven exploded
 * view described in `components.md`. This rebuild matches what's actually in
 * the design; hotspot hover/focus tooltips and a mobile fallback list keep
 * the same accessibility contract the fuller spec calls for.
 */
export function CarAnatomy() {
  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-neutral-800">{t.heading}</h2>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[7fr_3fr] lg:items-center">
        <div className="relative aspect-[971/555] w-full">
          <Image
            src="/images/home/anatomy-car.webp"
            alt="AutoRoom-ի միջոցով ներմուծված մեքենայի օրինակ"
            fill
            sizes="(min-width: 1024px) 65vw, 100vw"
            className="object-contain"
          />
          {t.imageHotspots.map((hotspot) => (
            <Hotspot key={hotspot.text} text={hotspot.text} top={hotspot.top} left={hotspot.left} />
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-1">
          {t.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-home-stat-sm font-bold text-ink">{stat.value}</dd>
              <p className="mt-1 font-display text-home-label font-bold text-ink">{stat.label}</p>
            </div>
          ))}
        </dl>
      </div>

      {/* Screen-reader / keyboard fallback: same copy as the hover tooltips,
          always available without relying on hover precision over the photo. */}
      <ul className="sr-only">
        {t.imageHotspots.map((hotspot) => (
          <li key={hotspot.text}>{hotspot.text}</li>
        ))}
      </ul>
    </div>
  );
}

function Hotspot({ text, top, left }: { text: string; top: string; left: string }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top, left }}>
      <button
        type="button"
        aria-describedby={tooltipId}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-6 w-6 items-center justify-center rounded-pill border-2 border-accent bg-white/90 shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={`absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-md bg-ink p-3 text-left shadow-card transition-opacity duration-micro ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <p className="text-caption text-white">{text}</p>
      </div>
    </div>
  );
}
