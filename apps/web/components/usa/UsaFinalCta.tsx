'use client';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * USA S9 — the closing CTA, mirrors `ChinaFinalCta` exactly (same layout,
 * same tall pill button with the trailing diagonal arrow) since Figma
 * shares one final-CTA pattern across every listing-style page on the
 * site; only the copy and `sourceCta`/`interest` differ.
 *
 * Opens the USA auction contact popup (Figma node 242:1345) rather than
 * the generic Universal popup — this is the page's last CTA, reached only
 * after the auction/import-process content above it, so a visitor here is
 * the most likely of the page's three CTAs to already have a specific
 * auction car in mind, which is exactly what that popup's fields (car
 * link/lot number, budget, financing) are built for. `UsaHero`'s and
 * `UsaImportProcess`'s own CTAs stay on the Universal popup — undirected
 * "get me an offer" intent at the top of the page, not "help me with the
 * car I already found."
 */
export function UsaFinalCta() {
  const t = useMessages().usa.finalCta;
  const { openUsaAuctionPopup } = useLeadWidgets();

  return (
    <section className="bg-bg px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto flex max-w-container flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-home-h2 font-light text-white">{t.heading}</h2>
          <p className="mt-3 max-w-xl text-[36px] font-normal leading-[48px] text-white">
            {t.text}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openUsaAuctionPopup({ sourceCta: 'usa-s9-final-cta' })}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-pill bg-accent px-6 py-9 text-home-label font-normal text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t.cta}
          <ArrowUpRightIcon className="size-5" />
        </button>
      </div>
    </section>
  );
}
