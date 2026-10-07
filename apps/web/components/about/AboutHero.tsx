'use client';

import Link from 'next/link';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * About hero — Figma 436:2209: a 52px/66px heading (543px wide) on the left and,
 * 100px to its right, the 20px/28px company intro (666px) over two 48px pills —
 * gold "Ստանալ անվճար խորհրդատվություն" (Universal popup) and white
 * "Կապվել մեզ հետ" (link to /contact). The block starts 245px from the top of the
 * page (below the floating header) and is followed by 150px before the black band.
 */
export function AboutHero() {
  const t = useMessages().about;
  const { openUniversal } = useLeadWidgets();

  return (
    <section className="bg-surface-light px-4 pb-14 pt-32 text-ink sm:px-6 lg:px-12 lg:pb-[150px] lg:pt-[245px]">
      <div className="mx-auto flex max-w-[1358px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-[100px]">
        <h1 className="stretch-85 text-[34px] font-normal leading-[44px] text-ink sm:text-[44px] sm:leading-[56px] lg:w-[543px] lg:shrink-0 lg:text-[52px] lg:leading-[66px]">
          {t.hero.heading}
        </h1>
        <div className="flex flex-col gap-8 lg:min-h-[196px] lg:max-w-[666px] lg:justify-between lg:py-2">
          <p className="stretch-93 text-[18px] font-normal leading-7 text-black lg:text-[20px]">
            {t.hero.intro}
          </p>
          <div className="flex flex-wrap items-center gap-[18px]">
            <button
              type="button"
              onClick={() => openUniversal({ sourceCta: 'about-s1-hero-consultation' })}
              className="inline-flex h-12 items-center justify-center gap-1 rounded-pill bg-accent px-6 text-[14px] font-medium leading-[18px] text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t.cta.consultation}
              <ArrowUpRightIcon className="size-5" />
            </button>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center gap-1 rounded-pill bg-white px-6 text-[14px] font-medium leading-[18px] text-ink transition-colors duration-standard ease-expo hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {t.cta.contact}
              <ArrowUpRightIcon className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
