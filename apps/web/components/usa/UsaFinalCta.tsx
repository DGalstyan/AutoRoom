'use client';

import { CtaBand } from '@/components/home/CtaBand';
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
    <CtaBand
      padded
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      onClick={() => openUsaAuctionPopup({ sourceCta: 'usa-s9-final-cta' })}
    />
  );
}
