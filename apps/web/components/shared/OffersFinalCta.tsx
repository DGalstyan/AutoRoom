'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * /offers closing CTA — the black 1344×336 gold-edged card the China, USA and Contact pages use; opens the Universal popup (not the Quiz) per
 * `references/pages.md`.
 */
export function OffersFinalCta() {
  const t = useMessages().offers.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <CtaBand
      variant="card"
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      buttonTone="glass"
      onClick={() => openUniversal({ sourceCta: 'offers-s3-final-cta' })}
    />
  );
}
