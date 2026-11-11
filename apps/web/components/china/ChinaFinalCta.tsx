'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * China closing CTA — Figma draws it as the rounded black card with a gold edge (the `card` look of `CtaBand`,
 * like Home/About/USA), on the light page with 48px side margins: a 44px light heading with a 36px sub-line and
 * the glass button, which opens the (non-per-car) UniversalPopup.
 */
export function ChinaFinalCta() {
  const t = useMessages().china.finalCta;
  const { openUniversal } = useLeadWidgets();

  return (
    <CtaBand
      variant="card"
      heading={t.heading}
      sub={t.text}
      buttonLabel={t.cta}
      buttonTone="glass"
      onClick={() =>
        openUniversal({ sourceCta: 'china-s7-final-cta', preselect: { interest: 'china' } })
      }
    />
  );
}
