'use client';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import type { Car } from '@/lib/types/car';

/**
 * USA auction car-detail S2.3 — "Հետևել աճուրդին օնլայն": the View-Only
 * (Guest Login) explanation + "Ինչպե՞ս է աշխատում" 5-step how-it-works +
 * the two CTAs (`Տեսնել մեքենան օնլայն` / `Կապ հաստատիր մեզ հետ`). Pixel-
 * matched to Figma's "USA Inner" page (node 282:1508, file
 * 9Lq4XpWusTJj1VnM6laAZr) — everything below the hero and above
 * `SimilarOffers`.
 *
 * The 5-step list under "Ինչպե՞ս է աշխատում" reuses the exact same 5
 * strings as the "Դու կարող ես տեսնել՝" list right above it (both read
 * verbatim off the Figma frame's own text). Every attempt to zoom into
 * those 5 numbered rows individually to check whether Figma's real text
 * there differs kept re-selecting the row's container rather than its
 * text leaf (a persistent Figma-canvas-zoom tooling failure this
 * session, not a shortcut taken lightly) — reusing the verified list
 * above it is the closest honest source rather than inventing new copy;
 * if the real per-step wording turns out to differ, only
 * `messages/*.json`'s `common.carDetail.auctionFollowAlong.steps` needs
 * correcting, not this component.
 *
 * Only rendered for `condition === 'AUCTION'` cars — available/on-road
 * cars have no auction to follow. `Տեսնել մեքենան օնլայն` only renders
 * once `car.auctionViewUrl` is set (same "skip until set" contract as
 * every other optional `Car` field — see `CarSpecs`), since the button
 * would otherwise have nowhere real to go; `Կապ հաստատիր մեզ հետ` always
 * renders, opening the already-built `UsaAuctionContactPopup`.
 *
 * Not built here (same scope line `/usa/auctions/[slug]`'s own doc
 * comment already draws): the Copart/IAAI-vs-Manheim platform-conditional
 * CTA logic (Manheim gets no direct view-online link at all) — that needs
 * an `auctionPlatform` field the `Car` model doesn't carry, a separate,
 * larger effort.
 */
export function AuctionFollowAlong({ car }: { car: Car }) {
  const t = useMessages().common.carDetail.auctionFollowAlong;
  const { openUsaAuctionPopup } = useLeadWidgets();

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-[24px] font-bold leading-[36px] text-neutral-800">
          {t.heading}
        </h2>
        <div className="flex flex-col gap-3 text-lead text-neutral-700">
          <p>{t.intro1}</p>
          <p>{t.intro2}</p>
          <div>
            <p>{t.listIntro}</p>
            <ul className="ml-5 list-disc">
              {t.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <p>{t.disclaimer}</p>
        </div>
      </div>

      <div className="flex flex-col gap-12 rounded-2xl bg-bg px-6 py-16 text-white sm:px-12">
        <h3 className="text-center font-display text-home-h2 font-light text-white">
          {t.howItWorksHeading}
        </h3>

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {t.steps.map((step, index) => (
            <div key={step} className="flex items-center gap-4 rounded-[20px] bg-white/10 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-white/10 text-caption text-white/70">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-lead text-white">{step}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {car.auctionViewUrl && (
            <a
              href={car.auctionViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-4 text-[16px] text-neutral-900 transition-colors duration-standard hover:bg-accent-600"
            >
              {t.viewOnlineCta}
              <ArrowUpRightIcon className="size-5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => openUsaAuctionPopup({ sourceCta: 'usa-auction-detail-follow-along' })}
            className="inline-flex items-center gap-2 rounded-pill border border-white px-6 py-4 text-[16px] text-white transition-colors duration-standard hover:bg-white/10"
          >
            {t.contactCta}
            <ArrowUpRightIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
