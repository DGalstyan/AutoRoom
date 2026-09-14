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
 * on the right. An earlier pass here concluded every card shares one
 * identical "someone at a laptop" placeholder — wrong, from checking the
 * image via Figma's canvas-zoom-to-selection menu action, which (contrary
 * to its name) doesn't actually pan the canvas to the newly selected node,
 * so every check kept landing on the same on-screen pixels regardless of
 * which card was selected. Re-verified per card by double-clicking directly
 * into each card's rendered image on the canvas (drilling through the
 * frame to the actual Rectangle fill) and reading its real asset name in
 * the Assets/Export panel: 9 of the 11 cards carry a genuinely distinct
 * real photo; only `Card 1`/`Card 5` (Պատվերի մշակում / Փիքափ աճուրդից) and
 * `Card 8`/`Card 9` (the duplicate-content pair, standing in for the
 * missing "loading container" step and the real "Կոնտեյները նավի վրա" step)
 * are byte-identical pairs in Figma itself. All 9 unique files were
 * exported via Figma's own Assets → Export panel into
 * `public/images/usa/process-step-{2..11}.png` (step 1 keeps the original
 * `process-step.png`, reused for step 5 since Figma reuses it there too).
 * Each row is also topped by a segmented progress bar (Figma's "Lines":
 * more segments turn gold as the steps advance) — reproduced here computed
 * from the step's own index rather than hand-placed dashes.
 *
 * Not reproduced: Figma's own scroll-driven video/AI-video playback (the
 * written spec's "Scrollytelling + AI video") — no scroll-animation
 * library is installed in this project (see `Reveal`'s doc comment), so
 * each row instead does a plain reveal-on-scroll, one `Reveal` per step.
 *
 * The closing CTA opens the USA auction contact popup (see
 * `UsaAuctionContactPopup`'s own doc comment), not the generic Universal
 * popup — a visitor who just read through the whole 11-step import
 * timeline is closer to "help me with the specific car I'm importing"
 * than "get me a general offer", same reasoning as `UsaFinalCta`'s own
 * CTA below it. `UsaHero`'s top-of-page CTA is the only one left on the
 * Universal popup, for undirected intent.
 *
 * Per direct user feedback, the 11 cards now stack on scroll: each one
 * `sticky top-24`s under the fixed header, and the next card (a higher
 * `zIndex`, set inline since Tailwind's JIT can't see a dynamically built
 * `z-[n]` class name) slides up and over it, covering it — step 2 comes to
 * rest on step 1, step 3 on step 2, and so on. Pure CSS `position: sticky`,
 * no scroll library, consistent with `Reveal`'s own no-dependency approach
 * above.
 */
const STEP_IMAGES = [
  '/images/usa/process-step.png', // 1. Պատվերի մշակում
  '/images/usa/process-step-2.png', // 2. Մեքենայի որոնում
  '/images/usa/process-step-3.png', // 3. Աճուրդից գնում
  '/images/usa/process-step-4.png', // 4. Վճարում
  '/images/usa/process-step.png', // 5. Փիքափ աճուրդից (same asset as step 1 in Figma)
  '/images/usa/process-step-6.png', // 6. Մեքենայի ընդունում և ստուգում
  '/images/usa/process-step-7.png', // 7. AutoRoom-ի հրապարակում
  '/images/usa/process-step-8.png', // 8. Բեռնում կոնտեյներ (spec-filled gap; reuses the duplicate-card asset)
  '/images/usa/process-step-8.png', // 9. Կոնտեյները նավի վրա (same asset as Card 8/9 in Figma)
  '/images/usa/process-step-10.png', // 10. Բեռնաթափում և ֆուռ
  '/images/usa/process-step-11.png', // 11. Գյումրի — ժամանում
] as const;
export function UsaImportProcess() {
  const t = useMessages().usa.importProcess;
  const { openUsaAuctionPopup } = useLeadWidgets();

  return (
    <div className="flex flex-col gap-16">
      <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        {t.steps.map((step, index) => (
          <div key={step.title} className="sticky top-24" style={{ zIndex: index + 1 }}>
            <Reveal>
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
                      src={STEP_IMAGES[index] ?? STEP_IMAGES[0]}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => openUsaAuctionPopup({ sourceCta: 'usa-import-process' })}
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-4 text-[20px] text-neutral-800 transition-colors duration-standard hover:bg-accent-600"
        >
          {t.cta}
          <ArrowUpRightIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
