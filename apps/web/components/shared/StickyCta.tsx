'use client';

import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { messages } from '@/lib/messages';

const t = messages.common.stickyCta;

/**
 * Global persistent CTA — opens the QUIZ popup (never Universal), per the
 * skill's lead-widget rule. Hides while any popup is open.
 */
export function StickyCta() {
  const { openQuiz, isAnyOpen } = useLeadWidgets();

  if (isAnyOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 sm:justify-end sm:pr-6">
      <button
        type="button"
        onClick={() => openQuiz({ sourceCta: 'sticky-cta' })}
        className="flex min-h-11 max-w-full items-center gap-3 rounded-pill bg-accent px-5 py-3 text-left text-small font-semibold text-white shadow-card transition-transform duration-standard ease-expo hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-body"
      >
        <span className="line-clamp-2 sm:line-clamp-1">{t.label}</span>
        <span className="hidden shrink-0 rounded-pill bg-white/20 px-3 py-1 text-caption uppercase tracking-wide sm:inline">
          {t.button}
        </span>
      </button>
    </div>
  );
}
