import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

interface Hotspot {
  text: string;
  left: string;
  top: string;
  width: string;
  height: string;
}

/**
 * "Ինչո՞ւ ընտրել AutoRoom-ը" — Figma 436:1911. A 971×555 car render with three
 * white-80% callout pills and gold ring markers (each with a thin stem to the
 * car), next to four big stats (36px semibold figure, 20px bold label, 60px
 * apart). Marker/pill positions are the design's own numbers, expressed in % of
 * the 971×555 box so the whole illustration scales as one on smaller screens.
 */
const PX = (x: number) => `${(x / 971) * 100}%`;
const PY = (y: number) => `${(y / 555.437) * 100}%`;

// [ring left, ring top] and [stem left, stem top, stem height], in design px.
const MARKERS = [
  { ring: [640, 514], stem: [651, 379, 137], src: 'line-a' },
  { ring: [145, 440], stem: [155, 312, 137], src: 'line-b' },
  { ring: [506, 25], stem: [517, 37, 75], src: 'line-c' },
] as const;

export function WhyAutoRoom({
  heading,
  hotspots,
  stats,
  markers = 'gold',
}: {
  heading: string;
  hotspots: Hotspot[];
  stats: { value: string; label: string }[];
  /** `gold` (Homepage): gold rings + stems drawn over a clean render. `baked` (About): the render with its red ring markers built in. */
  markers?: 'gold' | 'baked';
}) {
  return (
    <div className="flex flex-col gap-8 lg:gap-16">
      <h2 className="stretch-88 text-[28px] font-light leading-[38px] text-neutral-800 sm:text-home-h2 sm:leading-[58px]">
        {heading}
      </h2>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-[60px]">
        <Reveal className="relative aspect-[971/555.437] w-full lg:flex-1">
          <Image
            src={
              markers === 'baked'
                ? '/images/home/v2/anatomy-car-baked.webp'
                : '/images/home/v2/anatomy-car.webp'
            }
            alt=""
            fill
            sizes="(min-width: 1024px) 971px, 100vw"
            className="object-contain"
          />

          {(markers === 'baked' ? [] : MARKERS).map((m) => (
            <span key={m.src} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/home/v2/svg/ring.svg"
                alt=""
                className="absolute size-[21px] max-lg:size-[2.2%]"
                style={{
                  left: PX(m.ring[0]),
                  top: PY(m.ring[1]),
                  width: PX(24),
                  height: 'auto',
                  aspectRatio: '1',
                  transform: 'translate(-7.14%, -7.14%)',
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/home/v2/svg/${m.src}.svg`}
                alt=""
                className="absolute"
                style={{
                  left: PX(m.stem[0]),
                  top: PY(m.stem[1]),
                  height: PY(m.stem[2]),
                  width: m.src === 'line-a' ? '2px' : '1.5px',
                }}
              />
            </span>
          ))}

          {hotspots.map((spot) => (
            <p
              key={spot.text}
              className="absolute hidden items-center rounded-[72px] bg-white/80 px-[1.8%] text-[11.572px] font-medium leading-[14.465px] text-ink lg:flex"
              style={{
                left: spot.left,
                top: spot.top,
                width: spot.width,
                height: spot.height,
              }}
            >
              {spot.text}
            </p>
          ))}
        </Reveal>

        {/* Below `lg` the callout pills would be tiny type — list them under the picture instead. */}
        <ul className="flex flex-col gap-2 lg:hidden">
          {hotspots.map((spot) => (
            <li
              key={spot.text}
              className="flex items-start gap-3 rounded-lg bg-white px-4 py-3 text-[14px] leading-5 text-ink"
            >
              <span
                aria-hidden="true"
                className="mt-1 size-2.5 shrink-0 rounded-full border-2 border-accent"
              />
              {spot.text}
            </li>
          ))}
        </ul>

        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:flex lg:w-[313px] lg:shrink-0 lg:flex-col lg:gap-[60px]">
          {stats.map((stat, i) => (
            <li key={stat.label}>
              <Reveal delayMs={i * 100}>
                <p className="text-[32px] font-semibold leading-[48px] text-ink lg:mb-[-10px] lg:text-[36px] lg:leading-[56px]">
                  {stat.value}
                </p>
                <p className="stretch-93 text-[16px] font-bold leading-6 text-ink lg:text-[20px] lg:leading-8">
                  {stat.label}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
