'use client';

import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/** /offers S3 — opens the Universal popup (not the Quiz), per `references/pages.md`. */
export function OffersFinalCta() {
  const t = useMessages().offers.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <section className="bg-ink px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto flex max-w-container flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-home-h2 font-light text-white">{t.heading}</h2>
          <p className="mt-3 max-w-xl text-lead font-normal text-white/80">{t.text}</p>
        </div>
        <button
          type="button"
          onClick={() => openUniversal({ sourceCta: 'offers-s3-final-cta' })}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-pill border border-white/20 bg-transparent px-8 py-4 text-home-label font-normal text-white transition-colors duration-standard ease-expo hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t.cta}
        </button>
      </div>
    </section>
  );
}
