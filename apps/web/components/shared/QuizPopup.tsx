'use client';

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { MiniCarCard } from '@/components/shared/MiniCarCard';
import { MOCK_CARS } from '@/lib/data/mockCars';
import { interpolate } from '@/lib/messages';
import { useMessages } from '@/components/shared/LocaleProvider';
import type { Car } from '@/lib/types/car';
import type { LeadBudget, LeadInterest } from '@/lib/leads';

type Fuel = 'ev' | 'hybrid' | 'benzin';
type Usage = 'city' | 'family' | 'travel';
type Country = 'usa' | 'china' | 'any';
type Timing = 'now' | '1-3m' | 'browsing';

interface QuizAnswers {
  budget?: LeadBudget;
  fuel?: Fuel;
  usage?: Usage;
  country?: Country;
  timing?: Timing;
}

const QUESTION_ORDER = ['budget', 'fuel', 'usage', 'country', 'timing'] as const;
type QuestionKey = (typeof QUESTION_ORDER)[number];

const FUEL_TO_POWERTRAIN: Record<Fuel, Car['powertrain']> = {
  ev: 'EV',
  hybrid: 'HYBRID',
  benzin: 'BENZIN',
};

function recommendCars(answers: QuizAnswers): Car[] {
  let pool = MOCK_CARS.slice();
  if (answers.country === 'usa') pool = pool.filter((car) => car.origin === 'USA');
  else if (answers.country === 'china') pool = pool.filter((car) => car.origin === 'CHINA');

  if (answers.fuel) {
    const matched = pool.filter((car) => car.powertrain === FUEL_TO_POWERTRAIN[answers.fuel!]);
    if (matched.length > 0) pool = matched;
  }

  // Simplistic placeholder matcher — pending a real recommendation engine.
  if (pool.length < 3) pool = MOCK_CARS.slice();
  return pool.slice(0, 3);
}

export interface QuizPopupProps {
  open: boolean;
  onClose: () => void;
  sourcePage: string;
  sourceCta: string;
  onOpenUniversal: (opts: {
    sourceCta: string;
    preselect?: Partial<{ interest: LeadInterest; budget: LeadBudget }>;
    comment?: string;
    quizAnswers?: Record<string, string>;
  }) => void;
}

export function QuizPopup({ open, onClose, sourceCta, onOpenUniversal }: QuizPopupProps) {
  const messages = useMessages();
  const t = messages.common.quiz;
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0); // 0..4 questions, 5 = result
  const [answers, setAnswers] = useState<QuizAnswers>({});

  // Reset on every (re)open, adjusted during render rather than in an effect
  // (React's recommended pattern — see UniversalPopup for the same shape).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(0);
      setAnswers({});
    }
  }

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const isResult = step >= QUESTION_ORDER.length;
  const recommended = useMemo(() => recommendCars(answers), [answers]);

  function setAnswer<K extends QuestionKey>(key: K, value: QuizAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleGetOffer() {
    const interest: LeadInterest | undefined =
      answers.country === 'usa' ? 'usa' : answers.country === 'china' ? 'china' : 'undecided';
    const carNames = recommended.map((car) => `${car.make} ${car.model}`).join(', ');
    onOpenUniversal({
      sourceCta,
      preselect: { interest, budget: answers.budget },
      comment: `${t.resultCommentPrefix}${carNames}`,
      quizAnswers: Object.fromEntries(
        Object.entries(answers).filter(([, value]) => value !== undefined),
      ) as Record<string, string>,
    });
  }

  const currentKey = QUESTION_ORDER[step];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      titleId={titleId}
      closeLabel={messages.common.popup.close}
    >
      {!isResult && currentKey ? (
        <QuizQuestion
          questionKey={currentKey}
          step={step}
          headingRef={headingRef}
          titleId={titleId}
          value={answers[currentKey]}
          onSelect={(value) => {
            setAnswer(currentKey, value as never);
            if (step < QUESTION_ORDER.length - 1) setStep(step + 1);
            else setStep(QUESTION_ORDER.length);
          }}
          onBack={step > 0 ? () => setStep(step - 1) : undefined}
        />
      ) : (
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-muted">{t.title}</p>
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 font-display text-h3 font-bold text-ink outline-none"
          >
            {t.resultTitle}
          </h2>
          <p className="mt-1 text-body text-muted">{t.resultSubtitle}</p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recommended.map((car) => (
              <MiniCarCard key={car.id} car={car} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" className="text-ink" onClick={() => setStep(0)}>
              {t.restart}
            </Button>
            <Button variant="primary" onClick={handleGetOffer}>
              {t.resultCta}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function QuizQuestion({
  questionKey,
  step,
  headingRef,
  titleId,
  value,
  onSelect,
  onBack,
}: {
  questionKey: QuestionKey;
  step: number;
  headingRef: RefObject<HTMLHeadingElement | null>;
  titleId: string;
  value: string | undefined;
  onSelect: (value: string) => void;
  onBack?: () => void;
}) {
  const t = useMessages().common.quiz;
  const question = t.questions[questionKey];
  const options = Object.entries(question.options) as [string, string][];

  return (
    <div>
      <p className="text-caption font-medium uppercase tracking-wide text-muted">
        {interpolate(t.step, { current: String(step + 1), total: '5' })}
      </p>
      <h2
        id={titleId}
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-display text-h3 font-bold text-ink outline-none"
      >
        {question.label}
      </h2>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-labelledby={titleId}>
        {options.map(([key, label]) => (
          <Chip key={key} selected={value === key} onClick={() => onSelect(key)}>
            {label}
          </Chip>
        ))}
      </div>
      {onBack && (
        <Button variant="ghost" className="mt-6 text-ink" onClick={onBack}>
          {t.back}
        </Button>
      )}
    </div>
  );
}
