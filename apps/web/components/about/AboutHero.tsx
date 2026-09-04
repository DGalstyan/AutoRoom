'use client';

import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * About S1 — light 2-col hero (`references/pages.md` "6. About", S1). Figma
 * node `123:327` (file `9Lq4XpWusTJj1VnM6laAZr`, re-verified directly in the
 * Figma canvas via Dev Mode inspection — the page's own root frame is
 * `#F7F7F7`/`surface-light`, the heading text style resolves to
 * `Neutral-100`/`#0D0D0D`, and the intro paragraph is plain `#000`, so this
 * section is light-on-dark's opposite of what a first pass assumed): left a
 * big heading, right the company intro paragraph + two CTAs — gold "Ստանալ
 * անվճար խորհրդատվություն" (opens the Universal popup) and solid-white
 * "Կապվել մեզ հետ". `/contact` doesn't exist yet, so the second button also
 * opens the popup rather than linking to a page that would 404 — a
 * deliberate substitution, not the literal Figma behavior. This section
 * supplies its own header clearance (`pt-32`/`sm:pt-40`), so the page no
 * longer needs the borrowed-clearance workaround the team-grid-only version
 * used.
 */
export function AboutHero() {
  const t = useMessages().about;
  const { openUniversal } = useLeadWidgets();

  return (
    <section className="bg-surface-light px-4 pb-14 pt-32 text-ink sm:px-6 sm:pb-24 sm:pt-40">
      <div className="mx-auto grid max-w-container grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-[100px]">
        <h1 className="font-display text-home-h2 font-light text-ink">{t.hero.heading}</h1>
        <div>
          <p className="text-lead font-normal text-ink">{t.hero.intro}</p>
          <div className="mt-9 flex flex-wrap items-center gap-[18px]">
            <button
              type="button"
              onClick={() => openUniversal({ sourceCta: 'about-s1-hero-consultation' })}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-pill bg-accent px-6 py-3 text-small font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600"
            >
              {t.cta.consultation}
            </button>
            <button
              type="button"
              onClick={() => openUniversal({ sourceCta: 'about-s1-hero-contact' })}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-pill bg-white px-6 py-3 text-small font-medium text-ink shadow-card transition-colors duration-standard ease-expo hover:bg-white/90"
            >
              {t.cta.contact}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
