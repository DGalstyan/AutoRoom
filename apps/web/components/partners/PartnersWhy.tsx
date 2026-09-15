'use client';

import Image from 'next/image';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` S2 "Why partner" — Figma's own mockup (node 291:732's
 * `Metrics` group) shows this as a plain 8-tile grid on a flat background,
 * which is what this component originally matched. Per explicit user
 * feedback, that reads as inconsistent with the rest of the site: every
 * other "why choose us"-shaped section (China's `ChinaWhyOrder`, the
 * Homepage ecosystem panel) uses one established pattern instead — a
 * photo with a frosted glass list card overlaid — so this now follows
 * that same component shape rather than Figma's own rougher grid.
 * `PartnersWhoCanJoin` (right below this one) is rebuilt to match too, for
 * the same reason.
 *
 * The 8 benefit tiles (`title`/`text` pairs, unchanged from the original
 * Figma-verified content) are flattened into one line each, the same way
 * `ChinaWhyOrder`'s `ecosystem` list is flat strings.
 */
export function PartnersWhy() {
  const t = useMessages().partners.why;

  return (
    <section className="bg-surface-light px-4 py-14 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-container flex-col gap-14">
        <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

        <div className="relative overflow-visible rounded-[32px]">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[32px] sm:aspect-[980/551] sm:w-[72.917%]">
            <Image
              src="/images/partners/hero.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 980px, 100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/0 to-[95.372%] to-black/[0.89]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-4 px-4 sm:absolute sm:right-0 sm:top-[16%] sm:mt-0 sm:w-[90%] sm:max-w-[473px] sm:px-0 sm:pr-4">
            <ul className="flex flex-col gap-3 rounded-[32px] bg-white/[0.32] p-8 shadow-card backdrop-blur-md">
              {t.items.map((item) => (
                <li
                  key={item.title}
                  className="text-home-label font-normal leading-[28px] text-ink"
                >
                  {[item.title, item.text].filter(Boolean).join(' ')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
