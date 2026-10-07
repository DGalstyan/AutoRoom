import { AnimatedImage } from '@/components/ui/AnimatedImage';
import { Reveal } from '@/components/ui/Reveal';

/**
 * AutoRoom ecosystem — Figma 436:2026/2029. A 980×551 animated photo (the
 * design's GIF, here a lazy-loaded animated WebP with a poster) with a
 * bottom-heavy black scrim, and a 32%-white glass panel (473 wide, 32px
 * padding, a single column of eight 20px/28px items 12px apart) that starts 90px
 * below the photo's top and overhangs its right edge out to the column edge.
 * No visible heading in the design — an sr-only one keeps the outline correct.
 */
export function EcosystemShowcase({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div className="relative">
      <h2 className="sr-only">{heading}</h2>
      <Reveal className="w-full lg:-ml-[2px] lg:w-[72.917%]">
        <div className="relative aspect-[980/551] overflow-hidden rounded-[32px]">
          <AnimatedImage
            src="/images/home/v2/ecosystem.webp"
            poster="/images/home/v2/ecosystem-poster.webp"
            lazy
            className="absolute inset-0"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/0 to-[95.372%] to-black/[0.89]"
            aria-hidden="true"
          />
        </div>
      </Reveal>

      <Reveal
        delayMs={200}
        className="mt-4 lg:absolute lg:right-0 lg:top-[16%] lg:mt-0 lg:w-[35.19%] lg:min-w-[300px]"
      >
        <ul className="flex flex-col gap-3 rounded-[32px] bg-white/[0.32] p-8 backdrop-blur-md">
          {items.map((item) => (
            <li key={item} className="stretch-93 text-[20px] font-normal leading-7 text-ink">
              {item.trim()}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
