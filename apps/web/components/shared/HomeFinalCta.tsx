'use client';

import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { messages } from '@/lib/messages';

const t = messages.home.finalCta;

/** S10 — the other of the two spots that opens the Quiz, not the Universal popup. */
export function HomeFinalCta() {
  const { openQuiz } = useLeadWidgets();

  return (
    <section className="bg-bg px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto flex max-w-container flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-home-h2 font-light text-white">{t.heading}</h2>
          <p className="mt-3 max-w-xl text-lead font-normal text-white/80">{t.text}</p>
        </div>
        <button
          type="button"
          onClick={() => openQuiz({ sourceCta: 'home-s10-final-cta' })}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-pill bg-accent px-8 py-4 text-home-label font-normal text-ink transition-colors duration-standard ease-expo hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t.cta}
        </button>
      </div>
    </section>
  );
}
