'use client';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * China S7 — the closing CTA, opens the (non-per-car) UniversalPopup.
 * Pixel-matched to Figma node 101:132/101:138 (verified via
 * get_design_context): the real `BTN` instance is `px-6 py-9` — the same
 * tall ~108px pill as every other final-CTA button on the site — with a
 * trailing diagonal arrow (`ArrowUpRightIcon`) that this button was
 * missing entirely, same pixel-audit finding as `AboutFinalCta`/
 * `HomeFinalCta`.
 */
export function ChinaFinalCta() {
  const t = useMessages().china.finalCta;
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
          onClick={() =>
            openUniversal({ sourceCta: 'china-s7-final-cta', preselect: { interest: 'china' } })
          }
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-pill bg-accent px-6 py-9 text-home-label font-normal text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t.cta}
          <ArrowUpRightIcon className="size-5" />
        </button>
      </div>
    </section>
  );
}
