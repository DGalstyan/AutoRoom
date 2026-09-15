'use client';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useBookingPopup } from '@/components/partners/PartnersBookingProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` S1 hero — Figma's "Dealers" page (node 291:693, file
 * 9Lq4XpWusTJj1VnM6laAZr). Two CTAs, both pulled verbatim from Figma:
 * `Դառնալ գործընկեր` opens the meeting-booking popup (`references/pages.md`
 * S1 says this CTA "scrolls to final CTA booking popup" — this page has
 * no separate scroll-to-CTA section duplicating the popup, so it opens it
 * directly instead of scrolling to a copy of itself); `Խոսել մեր
 * մասնագետի հետ` is a plain click-to-call link, matching the spec's own
 * "click-to-call AutoRoom" description for this exact button.
 */
export function PartnersHero() {
  const t = useMessages().partners.hero;
  const { open } = useBookingPopup();

  return (
    <section className="relative isolate overflow-hidden bg-bg px-4 pb-14 pt-32 text-white sm:px-6 sm:pb-24 sm:pt-40">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative mx-auto max-w-container text-center">
        <h1 className="mx-auto max-w-3xl animate-fade-up font-display text-home-hero font-bold text-white motion-reduce:animate-none">
          {t.h1}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lead text-white/70 [animation-delay:100ms] motion-reduce:animate-none">
          {t.text}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => open('partners-hero')}
            className="inline-flex min-h-11 animate-fade-up items-center gap-1 rounded-pill bg-accent px-7 py-4 text-home-label font-normal text-ink transition-colors duration-standard ease-expo [animation-delay:150ms] hover:bg-accent-600 motion-reduce:animate-none"
          >
            {t.cta} <ArrowUpRightIcon />
          </button>
          <a
            href="tel:+37444111111" // Footer's own general contact number (Figma "Dealers" page footer, verbatim).
            className="inline-flex min-h-11 animate-fade-up items-center gap-1 rounded-pill border border-white px-7 py-4 text-home-label font-normal text-white transition-colors duration-standard ease-expo [animation-delay:150ms] hover:bg-white/10 motion-reduce:animate-none"
          >
            {t.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
