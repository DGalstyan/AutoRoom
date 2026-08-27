import Image from 'next/image';
import { messages } from '@/lib/messages';

const t = messages.home.anatomy;

/**
 * "Ինչո՞ւ ընտրել AutoRoom-ը" — Figma's actual Homepage treatment (node
 * `2001:1635`) is a single static hero photo with three *always-visible*
 * white/80%-opacity pill badges (dark text, small/medium weight) pinned to
 * points on the photo via a short connector line, plus a 4-stat column —
 * not the full scroll-driven exploded view described in `components.md`,
 * and not a hover-triggered tooltip either (an earlier version of this
 * component used a dark-background/white-text hover tooltip, which had both
 * the interaction model and the colors backwards relative to the design).
 * Badges render real text, so no separate sr-only fallback list is needed —
 * there's nothing hidden behind hover to duplicate.
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

        <dl className="flex flex-col gap-10 lg:gap-14">
          {t.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-home-stat-sm font-bold text-ink">{stat.value}</dd>
              <p className="mt-1 font-display text-home-label font-normal text-ink">{stat.label}</p>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/**
 * A pin (small accent-colored dot + short connector line) anchoring an
 * always-visible label badge — not a hover target. `top`/`left` mark the
 * pin's point on the photo; the badge sits just above it.
 */
function Hotspot({ text, top, left }: { text: string; top: string; left: string }) {
  return (
    <div className="absolute -translate-x-1/2" style={{ top, left }}>
      <div className="flex flex-col items-center">
        <div className="max-w-[220px] rounded-pill bg-white/80 px-4 py-2.5 text-center shadow-card backdrop-blur-sm">
          <p className="text-caption font-medium text-ink">{text}</p>
        </div>
        <span aria-hidden="true" className="h-4 w-px bg-accent/70" />
        <span
          aria-hidden="true"
          className="-mt-1 size-2 rounded-full bg-accent ring-2 ring-white/80"
        />
      </div>
    </div>
  );
}
