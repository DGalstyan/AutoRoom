'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * Contact closing call-to-action: "Չե՞ս գտել քեզ հարմար առաջարկ" (44px light), the 36px
 * sub-line and the glass "Լրացնել" button, which opens the Universal popup. Drawn as the
 * 1344px black card with the 48px radius and 6px gold edge (the same card as the China,
 * USA, Offers and About pages), not a full-bleed band.
 */
export function ContactFinalCta() {
  const t = useMessages().contact.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <CtaBand
      variant="card"
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      buttonTone="glass"
      onClick={() => openUniversal({ sourceCta: 'contact-s4-final-cta' })}
    />
  );
}
