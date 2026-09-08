'use client';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import type { LeadInterest } from '@/lib/leads';

interface ComingSoonHeroProps {
  h1: string;
  text?: string;
  ctaLabel: string;
  sourceCta: string;
  interest?: LeadInterest;
  comingSoonHeading: string;
  comingSoonText: string;
}

/**
 * Interim "quick fix" page for a route that's linked from the header/footer
 * nav (so it must resolve to a real page, not a 404) but whose full build
 * — the USA page's auctions/scrollytelling/customs-calculator, the
 * Partners page's meeting-booking portal — is its own separate, larger
 * effort. A real hero (page-specific H1/copy, still routes into the same
 * `UniversalPopup` every other CTA on the site uses) plus a plain
 * "coming soon" notice, so the nav link is never a dead end and every
 * visitor can still leave a lead in the meantime.
 */
export function ComingSoonHero({
  h1,
  text,
  ctaLabel,
  sourceCta,
  interest,
  comingSoonHeading,
  comingSoonText,
}: ComingSoonHeroProps) {
  const { openUniversal } = useLeadWidgets();

  return (
    <>
      <section className="bg-surface-light px-4 pb-14 pt-32 text-ink sm:px-6 sm:pb-24 sm:pt-40">
        <div className="mx-auto max-w-container">
          <h1 className="max-w-3xl font-display text-home-hero font-bold text-ink">{h1}</h1>
          {text && <p className="mt-6 max-w-2xl text-lead text-ink/70">{text}</p>}
          <button
            type="button"
            onClick={() =>
              openUniversal({ sourceCta, preselect: interest ? { interest } : undefined })
            }
            className="mt-10 inline-flex min-h-11 items-center gap-1 rounded-pill bg-accent px-7 py-4 text-home-label font-normal text-ink transition-colors duration-standard ease-expo hover:bg-accent-600"
          >
            {ctaLabel} <ArrowUpRightIcon />
          </button>
        </div>
      </section>

      <section className="bg-bg px-4 py-20 text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-container text-center">
          <h2 className="font-display text-home-h2 font-light text-white">{comingSoonHeading}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lead text-white/70">{comingSoonText}</p>
        </div>
      </section>
    </>
  );
}
