'use client';

import { useBookingPopup } from '@/components/partners/PartnersBookingProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import { Reveal } from '@/components/ui/Reveal';

/**
 * `/partners` onboarding — what it takes to join, in the order a dealer meets it: three steps,
 * who qualifies (requirements), what to bring (documents), and how fast we answer. The CTA opens
 * the same meeting-booking popup as the hero. Copy lives in `partners.onboarding`.
 */
export function PartnersOnboarding() {
  const t = useMessages().partners.onboarding;
  const { open } = useBookingPopup();

  return (
    <section
      aria-labelledby="partners-onboarding-heading"
      className="mx-auto flex max-w-page flex-col gap-10 px-4 py-12 sm:px-6 lg:gap-16 lg:px-12 lg:py-[75px]"
    >
      <h2 id="partners-onboarding-heading" className="type-h2 text-center text-ink">
        {t.heading}
      </h2>

      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {t.steps.map((step, index) => (
          <Reveal key={step.title} delayMs={index * 100}>
            <li className="flex h-full flex-col gap-3 rounded-[24px] bg-white p-6 lg:p-8">
              <span className="flex size-11 items-center justify-center rounded-full bg-neutral-25 text-[16px] font-medium text-neutral-800">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-[20px] font-bold leading-7 text-neutral-900">{step.title}</p>
              <p className="type-body text-neutral-700">{step.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <ChecklistCard title={t.requirementsTitle} items={t.requirements} />
        <ChecklistCard title={t.documentsTitle} items={t.documents} />
      </div>

      <div className="flex flex-col items-center gap-6 rounded-[24px] bg-ink px-6 py-8 text-center text-white lg:flex-row lg:justify-between lg:px-12 lg:py-10 lg:text-left">
        <div className="flex flex-col gap-1">
          <p className="text-[14px] leading-5 text-white/70">{t.responseLabel}</p>
          <p className="text-[24px] font-bold leading-8">{t.responseTime}</p>
        </div>
        <button
          type="button"
          onClick={() => open('partners-onboarding')}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t.cta}
        </button>
      </div>
    </section>
  );
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] bg-white p-6 lg:p-8">
      <h3 className="text-[20px] font-bold leading-7 text-neutral-900">{title}</h3>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="type-body flex items-start gap-3 text-neutral-800">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent"
            >
              <path
                d="m4.5 10.5 3.5 3.5 7.5-8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
