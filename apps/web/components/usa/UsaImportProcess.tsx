'use client';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/Reveal';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * USA S8 — "ԱՄՆ-ից մինչև Հայաստան, քայլ առ քայլ", the 12-step import
 * timeline `references/pages.md` documents (Պատվերի մշակում through Գյումրի
 * — ժամանում). Figma's `usa` page has no matching node for this section at
 * all — its "Container" frame (11 `Success story N` instances) turned out
 * to be a customer-story wall reused from the Homepage, not this process,
 * and the animated auction/payment-mockup imagery visible while exploring
 * the file belongs to a different page in the same document, not `usa`
 * (confirmed by re-checking each node's actual position in the page tree).
 * So this is built straight from the written spec's 12-step list and
 * copy hints, not pixel-matched to anything.
 *
 * A vertical reveal-on-scroll timeline rather than the spec's "Scrollytelling
 * + AI video" scroll-driven playback: there's no scroll-animation library in
 * this project (see `Reveal`'s own doc comment) and no real footage for any
 * of the 12 steps to scrub through — the spec's own "Mobile: vertical
 * timeline, same chips" fallback is simply the whole treatment here, one
 * `Reveal`-wrapped row per step (numbered circle badge, matching
 * `PriceJourney`'s own numbered-chip precedent, rather than inventing a new
 * icon per abstract step).
 */
export function UsaImportProcess() {
  const t = useMessages().usa.importProcess;
  const { openUniversal } = useLeadWidgets();

  return (
    <div className="flex flex-col gap-16">
      <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {t.steps.map((step, index) => (
          <Reveal key={step.title}>
            <div className="flex items-start gap-5 rounded-[20px] bg-white px-6 py-6 shadow-card sm:items-center sm:px-8">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-25 text-[16px] font-bold text-neutral-900">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-lead font-bold text-ink">{step.title}</p>
                  <p className="text-caption text-ink/50">{step.duration}</p>
                </div>
                <p className="text-body text-ink/70">{step.text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() =>
            openUniversal({ sourceCta: 'usa-import-process', preselect: { interest: 'usa' } })
          }
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-4 text-[20px] text-neutral-800 transition-colors duration-standard hover:bg-accent-600"
        >
          {t.cta}
          <ArrowUpRightIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
