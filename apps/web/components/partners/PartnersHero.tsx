'use client';

import { AnimatedImage } from '@/components/ui/AnimatedImage';
import { ArrowUpRightIcon, PhoneIcon } from '@/components/ui/icons';
import { useBookingPopup } from '@/components/partners/PartnersBookingProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` hero — Figma "Dealers" 441:5090, 0–773px:
 *  - the animated salt-flat clip (originally a GIF, here a ~2 MB animated WebP
 *    over an instant poster), 1448×814 at (-7,-2) — full-bleed, so it spans 100% of the viewport width at any size (height keeps the 1448:814 ratio, never below 814px);
 *  - a 21px backdrop-blur scrim at 50% black over the top 838px;
 *  - a 5px-blurred tan → #F7F7F7 fade (rgb(107,93,78) at the top), 1463×373 at
 *    y=633, so the page's light surface takes over beneath the buttons;
 *  - the centred block at y=271: 36px/56px semibold title, 24px/36px lead, then
 *    the gold "Դառնալ գործընկեր" pill (opens the meeting popup) and the white
 *    "Խոսել մեր մասնագետի հետ" pill (click-to-call).
 * Below `lg` the same layers stack in normal flow instead of absolute offsets.
 */
export function PartnersHero({ phone }: { phone: string | null }) {
  const t = useMessages().partners.hero;
  const { open } = useBookingPopup();

  return (
    <section className="relative isolate overflow-x-clip bg-surface-light px-4 pb-16 pt-[148px] text-white sm:px-6 lg:h-[773px] lg:p-0">
      <AnimatedImage
        src="/images/partners/hero.webp"
        poster="/images/partners/hero-poster.webp"
        priority
        className="absolute inset-x-0 -top-[2px] -z-10 h-[calc(100%-80px)] lg:h-[max(814px,56.22vw)]"
        imgClassName="object-cover"
      />
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[calc(100%-80px)] bg-black opacity-50 backdrop-blur-[21px] lg:h-[838px]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-[40%] bg-[linear-gradient(180.65deg,#6b5d4e_1.93%,#f7f7f7_97.66%)] blur-[5px] lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-[633px] lg:h-[373px] lg:w-[max(1463px,110vw)] lg:-translate-x-1/2"
        aria-hidden="true"
      />

      <div className="mx-auto flex max-w-[1028px] flex-col items-center gap-[18px] text-center lg:absolute lg:left-1/2 lg:top-[271px] lg:w-[1028px] lg:max-w-[calc(100vw-32px)] lg:-translate-x-1/2">
        <h1 className="stretch-90 animate-fade-up text-[26px] font-semibold leading-[36px] text-white motion-reduce:animate-none sm:text-home-hero">
          {t.h1}
        </h1>
        <p className="stretch-85 animate-fade-up text-[18px] leading-[28px] text-white [animation-delay:100ms] motion-reduce:animate-none sm:text-[24px] sm:leading-[36px]">
          {t.text}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-[18px] lg:mt-0">
          <button
            type="button"
            onClick={() => open('partners-hero')}
            className="inline-flex h-12 animate-fade-up items-center gap-1 rounded-pill bg-accent px-6 text-[14px] font-medium leading-[18px] text-ink transition-colors duration-standard ease-expo [animation-delay:150ms] hover:bg-accent-600 motion-reduce:animate-none"
          >
            {t.cta} <ArrowUpRightIcon className="size-5" />
          </button>
          {/* The B2B line is admin-managed (Settings → Contacts); no number, no button. */}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex h-12 animate-fade-up items-center gap-1 rounded-pill bg-white px-6 text-[14px] font-medium leading-[18px] text-ink transition-colors duration-standard ease-expo [animation-delay:150ms] hover:bg-neutral-50 motion-reduce:animate-none"
            >
              {t.secondaryCta} <PhoneIcon className="size-[18px]" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
