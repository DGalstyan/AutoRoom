import { AnimatedImage } from '@/components/ui/AnimatedImage';
import { getServerMessages } from '@/lib/i18n';

/**
 * USA `/usa` hero — Figma 440:3066, 0–831px:
 *  - the highway clip (originally a 5.8 MB GIF, here an animated WebP over an
 *    instant poster), 1448×814 at (-8,-198), i.e. full-bleed — it spans 100% of the viewport width at any size (height keeps the 1448:814 ratio, never below 814px);
 *  - a 21px backdrop-blur scrim at 50% black over the top 761px;
 *  - a 25px-blurred #151310 → #F7F7F7 fade, 1665×309 at y=575, so the headline
 *    sits on dark and the page's light surface takes over beneath it;
 *  - the centred 36px/56px headline at y=534 (1026px wide).
 * Figma has no subtext or button here (the header's own CTA is the lead path).
 * Below `lg` the same layers stack in normal flow instead of absolute offsets.
 */
export async function UsaHero() {
  const { messages } = await getServerMessages();

  return (
    <section className="relative isolate overflow-hidden bg-surface-light px-4 pb-16 pt-[148px] sm:px-6 lg:h-[831px] lg:p-0">
      <AnimatedImage
        src="/images/usa/hero.webp"
        poster="/images/usa/hero-poster.webp"
        priority
        className="absolute inset-x-0 top-0 -z-10 h-[calc(100%-80px)] lg:-top-[198px] lg:h-[max(814px,56.22vw)]"
        imgClassName="object-cover"
      />
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[calc(100%-80px)] bg-black opacity-50 backdrop-blur-[21px] lg:h-[761px]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-[40%] bg-[linear-gradient(180.48deg,#151310_7.7%,#f7f7f7_52.66%)] blur-[25px] lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-[575px] lg:h-[309px] lg:w-[max(1665px,110vw)] lg:-translate-x-1/2"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1026px] lg:absolute lg:left-1/2 lg:top-[534px] lg:w-[1026px] lg:-translate-x-1/2">
        <h1 className="stretch-90 animate-fade-up text-center font-display text-[26px] font-bold leading-[36px] text-white motion-reduce:animate-none sm:text-home-hero">
          {messages.usa.hero.h1}
        </h1>
      </div>
    </section>
  );
}
