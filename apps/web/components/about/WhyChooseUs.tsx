import Image from 'next/image';
import { getServerMessages } from '@/lib/i18n';

/**
 * About S3 "Why choose us" (`references/pages.md` "6. About" S3 says "reuse
 * Homepage advantages" — but no Homepage component is literally named that;
 * cross-checked against the real Figma frame instead). Figma node
 * `123:336`/`123:345` (file `9Lq4XpWusTJj1VnM6laAZr`, read directly via Dev
 * Mode inspection, not `get_design_context` — see report): a car photo next
 * to a 313px-wide, 60px-gap column of 4 stat rows, using the exact same
 * number/label pairing Homepage's own hero stats use (`text-home-stat` +
 * `text-home-label`, node `1344×677` content box matching the site's
 * `max-w-container`).
 *
 * Figma's own car photo is generic purchased stock (`carmen-boulogne-360…`),
 * not a real AutoRoom asset. `anatomy-car.webp` was tried first as the
 * substitute since it's already on-brand car photography, but it has
 * "CARBON FIBER ROOF" / "COPPER DETAILS" hotspot captions baked directly
 * into the image pixels (from its own use in Homepage's `CarAnatomy`
 * exploded view) — wrong context here, so `direction-china.webp` is used
 * instead: a clean, caption-free car cutout not otherwise shown on this
 * page. Figma also shows 3 small pin/callout labels over the car (like
 * `CarAnatomy`'s hotspots); those aren't reproduced here — a full
 * interactive hotspot rig for 3 short captions wasn't judged worth the
 * added complexity for this page, unlike Homepage's `CarAnatomy` where the
 * exploded view is the point of the section.
 */
export async function WhyChooseUs() {
  const { messages } = await getServerMessages();
  const t = messages.about.whyChooseUs;

  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>
      <div className="mt-10 grid grid-cols-1 items-center gap-10 sm:grid-cols-[1fr_313px] sm:gap-16">
        <div className="relative aspect-[971/555] w-full">
          <Image
            src="/images/home/direction-china.webp"
            alt=""
            fill
            sizes="(min-width: 640px) 60vw, 100vw"
            className="object-contain"
          />
        </div>
        <div className="flex flex-col gap-[60px]">
          {t.stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-home-stat font-bold text-ink">{stat.value}</p>
              <p className="mt-1 font-display text-home-label font-bold text-ink">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
