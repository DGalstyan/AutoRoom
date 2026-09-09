'use client';

import Link from 'next/link';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * About S5b — a light block repeating the hero's own intro paragraph and
 * both CTAs verbatim, sitting between `AboutFinalCta` (dark) and the global
 * `Footer` (Figma node `123:443`, file `9Lq4XpWusTJj1VnM6laAZr`). Missing
 * entirely from an earlier pass — easy to miss since it's a literal repeat
 * of `AboutHero`'s own copy rather than new content, but Figma does show it
 * as its own distinct section, not a stray duplicate layer.
 *
 * Reuses `about.hero.intro`/`about.cta.consultation`/`about.cta.contact` —
 * the same strings `AboutHero` renders — rather than a second, independently
 * maintained copy of the same sentence.
 *
 * Centered (`align-items: center` on Figma's own flex-column, verified via
 * Dev Mode CSS) — a pixel-audit fix from an initial pass that left it
 * start-aligned like `AboutHero`'s own (left-column) copy of this text.
 */
export function AboutRepeatCta() {
  const t = useMessages().about;
  const { openUniversal } = useLeadWidgets();

  return (
    <section className="bg-surface-light px-4 py-14 text-ink sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-container flex-col items-center text-center">
        <p className="max-w-3xl text-lead font-normal text-ink">{t.hero.intro}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-[18px]">
          <button
            type="button"
            onClick={() => openUniversal({ sourceCta: 'about-s5b-repeat-consultation' })}
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-pill bg-accent px-6 py-3 text-small font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600"
          >
            {t.cta.consultation}
            <ArrowUpRightIcon />
          </button>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-pill bg-white px-6 py-3 text-small font-medium text-ink shadow-card transition-colors duration-standard ease-expo hover:bg-white/90"
          >
            {t.cta.contact}
            <ArrowUpRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
