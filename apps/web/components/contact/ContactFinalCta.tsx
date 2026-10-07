'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * Contact closing band (Figma 436:2634, 1440×336 black): "Չե՞ս գտել քեզ հարմար
 * առաջարկ" (44px light), the 36px sub-line and the glass "Լրացնել" button, which
 * opens the Universal popup.
 */
export function ContactFinalCta() {
  const t = useMessages().contact.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <CtaBand
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      onClick={() => openUniversal({ sourceCta: 'contact-s4-final-cta' })}
    />
  );
}
