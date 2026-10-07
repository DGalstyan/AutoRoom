'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * Closing call-to-action band (Figma 436:1894, 1440×336 black): "Չե՞ս գտել քո
 * մեքենան" (44px light), the 36px sub-line, and the glass "Լրացնել" button —
 * the one spot (with the band above the offers) that opens the Quiz rather than
 * the Universal popup. Shared by every page that closes with this band.
 */
export function HomeFinalCta() {
  const t = useMessages().home.finalCta;
  const { openQuiz } = useLeadWidgets();

  return (
    <CtaBand
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      onClick={() => openQuiz({ sourceCta: 'home-s10-final-cta' })}
    />
  );
}
