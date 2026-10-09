'use client';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import type { Car } from '@/lib/types/car';

/**
 * "Ինչպե՞ս է աշխատում" on a USA auction car — Figma `Text` 448:14016: a black full-width
 * band, a 44px light centred title, five 760px translucent cards beside a numbered
 * 50px-circle timeline (48px between cards), then the two CTAs.
 *
 * `Տեսնել մեքենան օնլայն` only renders once `car.auctionViewUrl` is set, since the button
 * would otherwise have nowhere real to go; `Կապ հաստատիր մեզ հետ` opens the auction
 * contact popup. (Copart/IAAI-vs-Manheim CTA logic still needs an `auctionPlatform`
 * field the `Car` model doesn't carry.)
 */
export function AuctionHowItWorks({ car }: { car: Car }) {
  const t = useMessages().common.carDetail.auctionFollowAlong;
  const { openUsaAuctionPopup } = useLeadWidgets();

  return (
    <section
      aria-labelledby="auction-how-heading"
      className="bg-ink px-4 py-16 sm:px-6 lg:px-12 lg:py-[110px]"
    >
      <div className="mx-auto flex max-w-page flex-col items-center gap-10">
        <h2
          id="auction-how-heading"
          className="stretch-88 text-center text-[32px] font-light leading-10 text-white sm:text-home-h2 sm:leading-[58px]"
        >
          {t.howItWorksHeading}
        </h2>

        <ol className="flex w-full max-w-[860px] flex-col gap-9 lg:gap-12">
          {t.steps.map((step, index) => (
            <li key={step} className="relative flex min-h-[52px] items-center gap-4 sm:gap-10">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[14px] font-medium text-white sm:size-[50px] sm:text-[16px] sm:leading-6">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 rounded-[20px] bg-white/10 p-4 text-[16px] font-bold leading-6 text-white">
                {step}
              </span>
              {index < t.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-5 top-[calc(50%+27px)] h-9 w-0.5 -translate-x-1/2 bg-white/20 sm:left-[25px] sm:top-[58px]"
                />
              )}
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openUsaAuctionPopup({ sourceCta: 'usa-auction-detail-follow-along' })}
            className="inline-flex h-12 items-center gap-1 rounded-pill bg-neutral-50 px-6 text-[14px] leading-[18px] text-ink transition-colors duration-standard hover:bg-white"
          >
            {t.contactCta}
            <ArrowUpRightIcon className="size-5" />
          </button>
          {car.auctionViewUrl && (
            <a
              href={car.auctionViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-1 rounded-pill bg-accent px-6 text-[14px] leading-[18px] text-ink transition-colors duration-standard hover:bg-accent-600"
            >
              {t.viewOnlineCta}
              <ArrowUpRightIcon className="size-5" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
