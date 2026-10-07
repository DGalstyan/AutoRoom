'use client';

import { CtaBand } from '@/components/home/CtaBand';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * The black band between the direction picker and the weekly offers (Figma
 * `Text` 436:1893): "Չե՞ս գտել քո մեքենան. միասին սկսենք ընտրությունը" + the glass
 * "Ընտրել" button. It is the old floating sticky CTA's copy, now an in-page band
 * (the design draws the heading clipped to a 25px box — an authoring slip — so
 * the full sentence is shown). Opens the Quiz, like the sticky CTA did.
 */
export function StartCtaBand() {
  const t = useMessages().common.stickyCta;
  const { openQuiz } = useLeadWidgets();
  return (
    <CtaBand
      heading={t.label}
      buttonLabel={t.button}
      onClick={() => openQuiz({ sourceCta: 'home-start-band' })}
    />
  );
}
