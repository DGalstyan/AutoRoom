'use client';

import { AnimatedImage } from '@/components/ui/AnimatedImage';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/Reveal';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * USA "ԱՄՆ-ից մեքենա բերելու գործընթացը" — the 12-step import timeline, Figma
 * `Container` 440:3721 (`Success story` cards 440:3723 … 440:3995).
 *
 * Each step is a 1344px white card (48px corners, soft 0/8/57 shadow, 64px
 * padding): a 12-segment progress bar whose gold segments grow with the step,
 * a 409px text column (52px gold number, 36px title, 20px copy, 16px duration)
 * and a 646×414 rounded clip on the right. The clips are the design's own
 * looping GIFs (0.6–1.3 MB animated WebP each, over an instant poster, loaded
 * only as they near the viewport); visitors who prefer reduced motion get the
 * posters only.
 *
 * The cards stack on scroll: each one `sticky top-24`s under the fixed header
 * and the next (higher `zIndex`) slides up over it — pure CSS, no scroll
 * library. The closing CTA opens the USA auction contact popup, as before.
 */
export function UsaImportProcess() {
  const t = useMessages().usa.importProcess;
  const { openUsaAuctionPopup } = useLeadWidgets();

  return (
    <div className="flex flex-col gap-8 lg:gap-[97px]">
      <h2 className="stretch-88 text-center text-[28px] font-light leading-[38px] text-ink sm:text-home-h2 sm:leading-[58px]">
        {t.heading}
      </h2>

      <div className="flex flex-col gap-6 lg:gap-14">
        {t.steps.map((step, index) => (
          <div key={step.title} className="sticky top-24" style={{ zIndex: index + 1 }}>
            <Reveal>
              <div className="flex flex-col gap-6 rounded-[32px] bg-white p-6 shadow-[0_8px_57px_rgba(0,0,0,0.03)] sm:p-10 lg:rounded-[48px] lg:p-16">
                {/* Figma's "Lines" progress indicator — segments up to and
                  including the current step turn gold. */}
                <div className="flex gap-[11px]" aria-hidden="true">
                  {t.steps.map((_, segmentIndex) => (
                    <span
                      key={segmentIndex}
                      className={`h-[6px] flex-1 rounded-[9px] ${
                        segmentIndex <= index ? 'bg-accent' : 'bg-neutral-50'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
                  <div className="flex flex-col justify-center gap-6 lg:h-[414px] lg:min-w-0 lg:flex-1 lg:gap-9 min-[1400px]:w-[409px] min-[1400px]:flex-none">
                    <p className="font-display text-[40px] font-bold leading-[52px] text-accent lg:text-[52px] lg:leading-[66px]">
                      {String(index + 1).padStart(2, '0')}.
                    </p>
                    <div className="flex flex-col gap-3">
                      <h3 className="stretch-90 text-[28px] font-normal leading-9 text-ink lg:text-[36px] lg:leading-[48px]">
                        {step.title}
                      </h3>
                      <p className="text-[18px] leading-[26px] text-neutral-800 lg:text-[20px] lg:leading-[28px]">
                        {step.text}
                      </p>
                    </div>
                    <p className="text-[16px] leading-6 text-neutral-800">
                      {t.durationLabel} {step.duration}
                    </p>
                  </div>

                  <AnimatedImage
                    src={`/images/usa/process/step-${index + 1}.webp`}
                    poster={`/images/usa/process/step-${index + 1}-poster.webp`}
                    lazy
                    className="relative aspect-[646/414] w-full rounded-[32px] lg:min-w-0 lg:flex-1 lg:rounded-[48px] min-[1400px]:w-[646px] min-[1400px]:flex-none"
                    imgClassName="object-cover"
                  />
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
          className="inline-flex min-h-12 items-center gap-2 rounded-pill bg-accent px-6 py-3 text-[20px] text-neutral-800 transition-colors duration-standard hover:bg-accent-600"
        >
          {t.cta}
          <ArrowUpRightIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
