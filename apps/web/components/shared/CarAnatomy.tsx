import Image from 'next/image';
import { messages } from '@/lib/messages';

const t = messages.home.anatomy;

/**
 * "Ինչո՞ւ ընտրել AutoRoom-ը" — pixel-matched to Figma node `2001:1635`.
 * Every position/size below is taken directly from that node's own layout
 * data (percentages of the 971×555.437 photo, or literal px for anything
 * Figma sized in px) — not eyeballed:
 *
 * - 3 always-visible white/80%-opacity pill badges (dark text) over the
 *   photo, each at Figma's exact left/top/width box (`ml-*`/`mt-*`/`w-*` in
 *   the export). No connector dot/line — removed per feedback.
 * - The 4-stat column: flex column, exact 64px gap, each number at its
 *   exact `leading-[56px]` with `-10px` bottom margin against the label
 *   (Figma's own spacing between number and label), both number and label
 *   bold (the export's `font-['SF_Armenian:Bold']` applies to the whole
 *   group, not just the numbers).
 *
 * Badges render real text, so no separate sr-only fallback list is needed —
 * there's nothing hidden behind hover to duplicate (an earlier version used
 * a dark-background/white-text hover tooltip, which had both the
 * interaction model and the palette backwards relative to the design).
 */
export function CarAnatomy() {
  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-neutral-800">{t.heading}</h2>

      <div className="mt-[64px] grid grid-cols-1 gap-[60px] lg:grid-cols-[1fr_313px] lg:items-center">
        <div className="relative aspect-[971/555.437] w-full">
          <Image
            src="/images/home/anatomy-car.webp"
            alt="AutoRoom-ի միջոցով ներմուծված մեքենայի օրինակ"
            fill
            sizes="(min-width: 1024px) 65vw, 100vw"
            className="object-contain"
          />
          {t.imageHotspots.map((hotspot) => (
            <Hotspot
              key={hotspot.text}
              text={hotspot.text}
              left={hotspot.left}
              top={hotspot.top}
              width={hotspot.width}
              height={hotspot.height}
            />
          ))}
        </div>

        <dl className="flex flex-col gap-[64px]">
          {t.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="mb-[-10px] font-display text-home-stat-sm font-bold leading-[56px] text-ink">
                {stat.value}
              </dd>
              <p className="font-display text-home-label font-bold leading-[32px] text-ink">
                {stat.label}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

interface HotspotProps {
  text: string;
  left: string;
  top: string;
  width: string;
  height: string;
}

/**
 * An always-visible label pill, positioned as an exact box (not a
 * center-anchored point) matching Figma's own `ml`/`mt`/`w`/`h` — not a
 * hover target.
 */
function Hotspot({ text, left, top, width, height }: HotspotProps) {
  return (
    <div className="absolute" style={{ left, top, width, height }}>
      <div className="flex h-full items-center justify-center rounded-[72.323px] bg-white/80 px-[17.357px] py-[11.572px] text-center shadow-card">
        <p className="text-[11.572px] font-medium leading-[14.465px] text-ink">{text}</p>
      </div>
    </div>
  );
}
