import { AnimatedImage } from '@/components/ui/AnimatedImage';
import { GlassButton } from '@/components/home/GlassButton';

/**
 * "Միշտ քո կողքին" — Figma 436:2005. A black full-bleed block: 44px light white
 * heading, then the 1067×647 3D Armenia map (the design's animated GIF — a gold
 * pin pulsing on Yerevan — here a lazy animated WebP over a poster), then the
 * glass "visit your nearest branch" button, 48px below. The button leads to the
 * Contact page, where the branches (addresses, phones, hours) live.
 */
export function NearYouMap({ heading, cta, href }: { heading: string; cta: string; href: string }) {
  return (
    <section className="bg-black text-white">
      <div className="mx-auto flex max-w-page flex-col items-center gap-10 px-4 py-12 sm:px-6 lg:gap-16 lg:px-12 lg:py-16">
        <h2 className="stretch-88 text-center text-[28px] font-light leading-[38px] sm:text-home-h2 sm:leading-[58px]">
          {heading}
        </h2>
        <div className="flex w-full flex-col items-center gap-8 lg:gap-12">
          <AnimatedImage
            src="/images/home/v2/map.webp"
            poster="/images/home/v2/map-poster.webp"
            lazy
            alt=""
            className="relative aspect-[1067/647] w-full max-w-[1067px]"
          />
          <GlassButton href={href}>{cta}</GlassButton>
        </div>
      </div>
    </section>
  );
}
