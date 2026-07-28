'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, ChipGroup, Dialog } from '@/components/ui';
import { CarCard } from '@/components/shared/CarCard';
import { CARS } from '@/data/cars';
import { QUIZ_QUESTIONS, recommendCars } from '@/lib/quiz';
import type { LeadBudget, LeadInterest, QuizAnswers, QuizContext } from '@/lib/lead';
import { t, tf } from '@/lib/i18n';

/**
 * "Գտիր քո մեքենան 60 վայրկյանում" — 5 chip questions, then 3 recommended cars.
 *
 * Reachable from exactly two places on the whole site (the global sticky CTA and
 * Homepage Section 10); every other CTA opens the Universal Popup. It never
 * submits a lead itself: the result CTA hands the answers to the Universal Popup,
 * which is the single submission path.
 *
 * One question per screen, because five chip groups stacked on one screen reads
 * as a form — which is what the quiz exists to avoid.
 */

export interface QuizPopupProps {
  open: boolean;
  onClose: () => void;
  /** Hands off to the Universal Popup with the answers + recommendations attached. */
  onComplete: (
    quiz: QuizContext,
    preselect: { interest?: LeadInterest; budget?: LeadBudget },
  ) => void;
}

export function QuizPopup({ open, onClose, onComplete }: QuizPopupProps) {
  // `LeadWidgetProvider` remounts the quiz on every open (see its `key`), so a
  // fresh run always starts at question 1 with no answers carried over.
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const headingRef = useRef<HTMLParagraphElement>(null);

  const total = QUIZ_QUESTIONS.length;
  const showResults = step >= total;

  // Each screen replaces the previous one, so focus has to follow it.
  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open, step]);

  const recommended = useMemo(
    () => (showResults ? recommendCars(answers, CARS) : []),
    [showResults, answers],
  );

  function answer(field: keyof QuizAnswers, value: string) {
    // One cast, contained here: the question list is data-driven, so the field
    // and its option type can only be tied together at runtime.
    setAnswers((current) => ({ ...current, [field]: value }) as QuizAnswers);
    setStep((current) => current + 1);
  }

  function handleComplete() {
    onComplete(
      { answers, recommended: recommended.map((car) => car.slug) },
      {
        budget: answers.budget,
        interest:
          answers.country === 'usa' ? 'usa' : answers.country === 'china' ? 'china' : undefined,
      },
    );
  }

  const question = showResults ? null : QUIZ_QUESTIONS[step];

  return (
    <Dialog open={open} onClose={onClose} title={t('quiz.title')} size="lg">
      {showResults ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p ref={headingRef} tabIndex={-1} className="text-h3 outline-none">
              {t('quiz.resultTitle')}
            </p>
            <p className="text-small text-muted">{t('quiz.resultSubtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {recommended.map((car) => (
              <CarCard key={car.slug} car={car} context="compact" />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" fullWidth onClick={handleComplete}>
              {t('quiz.resultCta')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAnswers({});
                setStep(0);
              }}
            >
              {t('common.cta.startOver')}
            </Button>
          </div>
        </div>
      ) : question ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-caption text-muted">
              {tf('quiz.progress', { current: step + 1, total })}
            </span>
            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={step + 1}
              aria-label={t('quiz.title')}
              className="h-1 w-full overflow-hidden rounded-pill bg-line-light"
            >
              <div
                className="h-full rounded-pill bg-accent transition-[width] duration-standard ease-expo"
                style={{ width: `${((step + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <p ref={headingRef} tabIndex={-1} className="sr-only">
            {t(question.labelKey)}
          </p>

          <ChipGroup label={t(question.labelKey)}>
            {question.options.map((option) => (
              <Chip
                key={option.value}
                selected={answers[question.field] === option.value}
                onClick={() => answer(question.field, option.value)}
              >
                {t(option.labelKey)}
              </Chip>
            ))}
          </ChipGroup>

          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((current) => current - 1)}>
              {t('common.cta.back')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
