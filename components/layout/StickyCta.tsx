'use client';

import { useLeadWidget } from '@/components/lead/LeadWidgetProvider';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

/**
 * Global persistent CTA — "Չե՞ս գտել քո մեքենան. միասին սկսենք ընտրությունը".
 * Opens the **Quiz Popup**, not the Universal Popup: this and Homepage S10 are
 * the only two Quiz entry points on the whole site.
 * Hides itself while any popup is open.
 */
export function StickyCta() {
  const { openQuiz, isOpen } = useLeadWidget();
  const label = t('stickyCta.label');

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-30 px-gutter-sm pb-4 transition-opacity duration-standard ease-expo lg:bottom-6 lg:left-auto lg:right-6 lg:px-0',
        isOpen ? 'opacity-0' : 'opacity-100',
      )}
      aria-hidden={isOpen}
    >
      <button
        type="button"
        onClick={() => openQuiz({ sourceCta: label })}
        tabIndex={isOpen ? -1 : 0}
        className={cn(
          'pointer-events-auto w-full rounded-pill bg-accent px-6 py-4 text-small font-semibold text-paper shadow-card',
          'transition-all duration-standard ease-expo hover:-translate-y-0.5 hover:bg-accent-600 lg:w-auto lg:text-body',
        )}
      >
        {label}
      </button>
    </div>
  );
}
