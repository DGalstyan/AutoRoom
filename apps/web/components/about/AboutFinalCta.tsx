'use client';

import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * About S5 Final CTA (`references/pages.md` "6. About" S5). Figma node
 * `123:298`/`123:299` (file `9Lq4XpWusTJj1VnM6laAZr`): same dark
 * heading+text-left / pill-button-right layout as `HomeFinalCta` and
 * `OffersFinalCta` — opens the Universal popup (this page has no Quiz-popup
 * spot per the skill's lead-widget rule, same reasoning as `OffersFinalCta`).
 *
 * The spec text also calls for a thin gradient banner-CTA above this
 * ("Հարցեր ունե՞ս․ խոսիր մասնագետի հետ → Հիմա") — not present as a distinct
 * element in the Figma frame itself, and the same "talk to someone now"
 * interaction already exists site-wide as the global `StickyCta`, so it's
 * not duplicated here as a one-off About-page element.
 */
export function AboutFinalCta() {
  const t = useMessages().about.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <section className="bg-bg px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto flex max-w-container flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-home-h2 font-light text-white">{t.heading}</h2>
          <p className="mt-3 max-w-xl text-lead font-normal text-white/80">{t.text}</p>
        </div>
        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'about-s5-final-cta' })}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-pill border border-white/20 bg-transparent px-8 py-4 text-home-label font-normal text-white transition-colors duration-standard ease-expo hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t.cta}
        </button>
      </div>
    </section>
  );
}
