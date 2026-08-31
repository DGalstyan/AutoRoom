'use client';

import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * Global persistent CTA — opens the QUIZ popup (never Universal), per the
 * skill's lead-widget rule. Hides while any popup is open.
 */
export function StickyCta() {
  const t = useMessages().common.stickyCta;
  const { openQuiz, isAnyOpen } = useLeadWidgets();

  if (isAnyOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 sm:justify-end sm:pr-6">
      <button
        type="button"
        onClick={() => openQuiz({ sourceCta: 'sticky-cta' })}
        className="flex min-h-11 max-w-full items-center gap-4 rounded-pill border border-white/10 bg-bg/90 py-2 pl-5 pr-2 text-left text-small font-medium text-white shadow-card backdrop-blur-lg transition-transform duration-standard ease-expo hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-body"
      >
        <span className="line-clamp-2 sm:line-clamp-1">{t.label}</span>
        <span className="shrink-0 rounded-pill bg-accent px-5 py-3 text-small font-normal text-ink">
          {t.button}
        </span>
      </button>
    </div>
  );
}
