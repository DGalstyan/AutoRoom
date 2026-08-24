'use client';

import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { messages } from '@/lib/messages';

const t = messages.home.finalCta;

/** S10 — the other of the two spots that opens the Quiz, not the Universal popup. */
export function HomeFinalCta() {
  const { openQuiz } = useLeadWidgets();

  return (
    <Section tone="dark" className="text-center">
      <h2 className="font-display text-h2 font-bold text-white">{t.heading}</h2>
      <p className="mx-auto mt-3 max-w-xl text-lead text-white/70">{t.text}</p>
      <Button
        variant="primary"
        size="lg"
        className="mt-8"
        onClick={() => openQuiz({ sourceCta: 'home-s10-final-cta' })}
      >
        {t.cta}
      </Button>
    </Section>
  );
}
