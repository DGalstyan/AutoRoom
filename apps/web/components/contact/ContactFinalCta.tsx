'use client';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * Contact `/contact` S4 — the closing CTA below the FAQ, missing from this
 * page entirely until this pass (Figma node `141:803`, file
 * `9Lq4XpWusTJj1VnM6laAZr`, verified via get_design_context). Same content
 * as `/offers`' own final CTA (`OffersFinalCta`) — Figma reuses this exact
 * block on both pages — but this page has its own copy under
 * `messages.contact.finalCta` rather than importing the Offers one, since
 * the two pages' content is independently admin-managed in principle.
 *
 * Layout matches `HomeFinalCta`/`AboutFinalCta`/`OffersFinalCta`: dark
 * section, heading+text left, a `px-6 py-9` (~108px tall) outline pill
 * button with a trailing arrow icon on the right. The subtext here is
 * Figma's own 36px/48px (`text-[36px]`), not the smaller `text-lead` the
 * sibling components use — verified against this node specifically, not
 * assumed from the others.
 */
export function ContactFinalCta() {
  const t = useMessages().contact.finalCta;
  const { openUniversal } = useLeadWidgets();

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
          onClick={() => openUniversal({ sourceCta: 'contact-s4-final-cta' })}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-pill border border-white/20 bg-transparent px-6 py-9 text-home-label font-normal text-white transition-colors duration-standard ease-expo hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t.cta}
          <ArrowUpRightIcon className="size-5" />
        </button>
      </div>
    </section>
  );
}
