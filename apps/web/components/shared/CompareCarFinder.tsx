'use client';

import { useState } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import { recommendCars, serializeQuizAnswers, type QuizAnswers } from '@/lib/quiz';
import type { LeadBudget } from '@/lib/leads';

const FIELD_CLASSES =
  'h-[72px] w-full appearance-none truncate rounded-pill bg-neutral-25 pl-6 pr-12 text-[16px] leading-6 text-ink outline-none';

/**
 * "Գտիր քո մեքենան 60 վայրկյանում" as an inline finder on `/compare`
 * (Figma node 393:530, file `9Lq4XpWusTJj1VnM6laAZr`) — the same 5
 * questions `QuizPopup` asks step-by-step in a modal, here as one static
 * form (all 5 visible together), for a visitor who's just found neither
 * compared car is right and wants another way in without leaving the page.
 *
 * Skips the popup's own "3 recommended cards" result screen: this frame
 * doesn't show one, and going from a compact form straight to
 * `UniversalPopup` (same `quizAnswers` handoff `QuizPopup`'s own
 * `handleGetOffer` does) matches what's actually in the mock. `recommendCars`
 * still runs so the lead comment names the same recommended cars the modal
 * quiz would have surfaced.
 */
export function CompareCarFinder() {
  const t = useMessages().common.compare.finder;
  const quizT = useMessages().common.quiz;
  const { openUniversal } = useLeadWidgets();
  const [answers, setAnswers] = useState<QuizAnswers>({});

  function set<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K] | '') {
    setAnswers((current) => ({ ...current, [key]: value || undefined }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const recommended = recommendCars(answers);
    const carNames = recommended.map((car) => `${car.make} ${car.model}`).join(', ');
    const interest =
      answers.country === 'usa' ? 'usa' : answers.country === 'china' ? 'china' : 'undecided';

    openUniversal({
      sourceCta: 'compare-car-finder',
      preselect: { interest, budget: answers.budget },
      comment: `${quizT.resultCommentPrefix}${carNames}`,
      quizAnswers: serializeQuizAnswers(answers),
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <h2 className="font-display text-home-h2 font-light text-ink">{quizT.title}</h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-end gap-6 rounded-[30px] bg-white p-9"
      >
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
          <FinderSelect
            label={quizT.questions.budget.label}
            value={answers.budget ?? ''}
            onChange={(value) => set('budget', value as LeadBudget)}
            options={quizT.questions.budget.options}
          />
          <FinderSelect
            label={quizT.questions.fuel.label}
            value={answers.fuel ?? ''}
            onChange={(value) => set('fuel', value as QuizAnswers['fuel'])}
            options={quizT.questions.fuel.options}
          />
          <FinderSelect
            label={quizT.questions.usage.label}
            value={answers.usage ?? ''}
            onChange={(value) => set('usage', value as QuizAnswers['usage'])}
            options={quizT.questions.usage.options}
          />
          <FinderSelect
            label={quizT.questions.country.label}
            value={answers.country ?? ''}
            onChange={(value) => set('country', value as QuizAnswers['country'])}
            options={quizT.questions.country.options}
          />
          <FinderSelect
            label={quizT.questions.timing.label}
            value={answers.timing ?? ''}
            onChange={(value) => set('timing', value as QuizAnswers['timing'])}
            options={quizT.questions.timing.options}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAnswers({})}
            className="h-12 rounded-pill bg-neutral-100 px-6 text-[14px] font-bold text-ink"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="h-12 rounded-pill bg-accent px-6 text-[14px] font-bold text-ink transition-colors duration-standard hover:bg-accent-600"
          >
            {t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

function FinderSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[16px] font-medium text-neutral-700">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={FIELD_CLASSES}
        >
          <option value="" />
          {Object.entries(options).map(([key, optionLabel]) => (
            <option key={key} value={key}>
              {optionLabel}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-6 top-1/2 size-4 -translate-y-1/2 text-ink"
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
