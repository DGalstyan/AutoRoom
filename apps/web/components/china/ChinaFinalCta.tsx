'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * China closing CTA — the black band shared with the other pages (Figma `Text`
 * 438:1034): a 44px light heading with a 36px sub-line and the glass button,
 * which opens the (non-per-car) UniversalPopup.
 */
export function ChinaFinalCta() {
  const t = useMessages().china.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <CtaBand
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      onClick={() =>
        openUniversal({ sourceCta: 'china-s7-final-cta', preselect: { interest: 'china' } })
      }
    />
  );
}
