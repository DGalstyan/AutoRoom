'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * /offers closing CTA — the black band shared with the other pages (Figma
 * `Text` 439:2600); opens the Universal popup (not the Quiz) per
 * `references/pages.md`.
 */
export function OffersFinalCta() {
  const t = useMessages().offers.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <CtaBand
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      onClick={() => openUniversal({ sourceCta: 'offers-s3-final-cta' })}
    />
  );
}
