'use client';

import Image from 'next/image';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/Reveal';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * USA S8 — the 11-step "ԱՄՆ-ից մինչև Հայաստան, քայլ առ քայլ" import timeline.
 *
 * This section DOES exist in Figma (node 218:177's `Container` frame,
 * `Card 1`…`Card 11`) — an earlier pass here concluded it didn't, having
 * checked only `Card 1` and stopped at its first two children ("Lines" +
 * one image frame) without expanding the third, deeper-nested group that
 * actually holds the number/heading/body/duration text. Every step's real
 * copy below was pulled from Figma via the Dev Mode Code panel and the
 * in-file text search (searching "Տևողությունը" surfaces all 11 duration
 * lines directly). One genuine gap in the source file itself: `Card 8` and
 * `Card 9` are an exact duplicate (both "AutoRoom-ի հրապարակում", back to
 * back) with no distinct "loading the container" step in between — the
 * 8th step below fills that gap using `references/pages.md`'s own step
 * list, which is the only place that content is named.
 *
 * Pixel-matched to the real per-step card: a numbered gold "0N." (accent
 * color) over a Headings/H2-Reg Mid heading (36px/48px regular — the same
 * style `branch-card-title` already encodes) and Labels/Label-L-Regular
 * body/duration text (16px/24px, Neutral-80 `#3D3D3D`), paired with a photo
 * on the right — the real Figma asset (`fotis-fotopoulos-...-unsplash`,
 * a laptop showing a payment-confirmation screen), exported from Figma's
 * own Assets panel (`public/images/usa/process-step.png`). Checking a
 * second card confirmed this exact same photo repeats across every step
 * (a single generic "someone at a laptop" stand-in, not unique per-step
 * photography), so every row here reuses the one exported file rather than
 * inventing 11 distinct images Figma itself doesn't have. Each row is also
 * topped by a segmented progress bar (Figma's "Lines": more segments turn
 * gold as the steps advance) — reproduced here computed from the step's
 * own index rather than hand-placed dashes.
 *
 * Not reproduced: Figma's own scroll-driven video/AI-video playback (the
 * written spec's "Scrollytelling + AI video") — no scroll-animation
 * library is installed in this project (see `Reveal`'s doc comment), so
 * each row instead does a plain reveal-on-scroll, one `Reveal` per step.
 */
export function UsaImportProcess() {
  const t = useMessages().usa.importProcess;
  const { openUniversal } = useLeadWidgets();

  return (
    <div className="flex flex-col gap-16">
      <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        {t.steps.map((step, index) => (
          <Reveal key={step.title}>
            <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-card sm:p-10">
              {/* Figma's "Lines" progress indicator — segments up to and
                  including the current step turn gold. */}
              <div className="flex gap-2" aria-hidden="true">
                {t.steps.map((_, segmentIndex) => (
                  <span
                    key={segmentIndex}
                    className={`h-1 flex-1 rounded-pill ${
                      segmentIndex <= index ? 'bg-accent' : 'bg-neutral-100'
                    }`}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-8 sm:flex-row sm:items-stretch">
                <div className="flex flex-1 flex-col gap-3">
                  <p className="font-display text-[48px] font-bold leading-none text-accent">
                    {String(index + 1).padStart(2, '0')}.
                  </p>
                  <h3 className="font-display text-branch-card-title text-neutral-900">
                    {step.title}
                  </h3>
                  <p className="text-lead text-neutral-800">{step.text}</p>
                  <p className="mt-auto text-lead text-neutral-800">
                    {t.durationLabel} {step.duration}
                  </p>
                </div>

                <div
                  className="relative min-h-[180px] flex-1 overflow-hidden rounded-xl sm:min-h-0"
                  aria-hidden="true"
                >
                  <Image
                    src="/images/usa/process-step.png"
                    alt=""
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
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
