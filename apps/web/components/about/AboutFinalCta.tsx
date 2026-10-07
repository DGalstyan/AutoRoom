'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * About closing band (Figma 436:2178, 1440×336 black): "Պատրա՞ստ ես ներմուծել քո
 * երազանքի մեքենան" (44px light), "Ստացիր անվճար խորհրդատվություն այսօր" (36px)
 * and the glass "Ստանալ խորհրդատվություն" button, which opens the Universal popup.
 */
export function AboutFinalCta() {
  const t = useMessages().about.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <CtaBand
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      onClick={() => openUniversal({ sourceCta: 'about-s5-final-cta' })}
    />
  );
}
