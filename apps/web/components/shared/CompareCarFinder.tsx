'use client';

import { useState } from 'react';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { useMessages } from '@/components/shared/LocaleProvider';
import { Reveal } from '@/components/ui/Reveal';
import { Field } from '@/components/ui/Field';
import { ListboxSelect } from '@/components/ui/ListboxSelect';
import { recommendCars, serializeQuizAnswers, type QuizAnswers } from '@/lib/quiz';
import type { LeadBudget } from '@/lib/leads';

const FIELD_CLASSES =
  'h-[72px] w-full truncate rounded-[50px] bg-neutral-25 pl-6 pr-12 text-[16px] leading-6 outline-none transition-shadow duration-standard focus:ring-2 focus:ring-accent';

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
  const [showHint, setShowHint] = useState(false);

  function set<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K] | '') {
    setShowHint(false);
    setAnswers((current) => ({ ...current, [key]: value || undefined }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (Object.values(answers).every((value) => !value)) {
      setShowHint(true);
      return;
    }
    const recommended = recommendCars(answers);
    const carNames = recommended.map((car) => `${car.make} ${car.model}`).join(', ');
    const answerSummary = (Object.keys(quizT.questions) as (keyof QuizAnswers)[])
      .filter((key) => answers[key])
      .map(
        (key) =>
          `${quizT.questions[key].label}: ${(quizT.questions[key].options as Record<string, string>)[answers[key] as string]}`,
      )
      .join(', ');
    // Only a stated country picks the popup's interest chip; otherwise it stays unselected rather than "not sure yet".
    const interest =
      answers.country === 'usa'
        ? 'usa'
        : answers.country === 'china'
          ? 'china'
          : answers.country === 'any'
            ? 'undecided'
            : undefined;

    openUniversal({
      sourceCta: 'compare-car-finder',
      preselect: { interest, budget: answers.budget, timing: answers.timing },
      comment: `${quizT.resultCommentPrefix}${carNames} (${answerSummary})`,
      quizAnswers: serializeQuizAnswers(answers),
    });
  }

  return (
    <Reveal className="flex flex-col gap-10">
      <h2 className="type-h2 text-ink">{quizT.title}</h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-end gap-6 rounded-[30px] bg-white p-9"
      >
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
          <FinderSelect
            label={quizT.questions.budget.label}
            value={answers.budget ?? ''}
            onChange={(value) => set('budget', value as LeadBudget)}
            placeholder={t.select}
            options={quizT.questions.budget.options}
          />
          <FinderSelect
            label={quizT.questions.fuel.label}
            value={answers.fuel ?? ''}
            onChange={(value) => set('fuel', value as QuizAnswers['fuel'])}
            placeholder={t.select}
            options={quizT.questions.fuel.options}
          />
          <FinderSelect
            label={quizT.questions.usage.label}
            value={answers.usage ?? ''}
            onChange={(value) => set('usage', value as QuizAnswers['usage'])}
            placeholder={t.select}
            options={quizT.questions.usage.options}
          />
          <FinderSelect
            label={quizT.questions.country.label}
            value={answers.country ?? ''}
            onChange={(value) => set('country', value as QuizAnswers['country'])}
            placeholder={t.select}
            options={quizT.questions.country.options}
          />
          <FinderSelect
            label={quizT.questions.timing.label}
            value={answers.timing ?? ''}
            onChange={(value) => set('timing', value as QuizAnswers['timing'])}
            placeholder={t.select}
            options={quizT.questions.timing.options}
          />
        </div>

        {showHint && (
          <p role="alert" className="text-small text-error">
            {t.pickOne}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setShowHint(false);
            }}
            className="h-12 rounded-pill bg-neutral-50 px-6 text-[14px] font-bold leading-5 text-ink transition-colors duration-standard hover:bg-neutral-100"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="h-12 rounded-pill bg-accent px-6 text-[14px] font-bold leading-5 text-ink transition-colors duration-standard hover:bg-accent-600"
          >
            {t.submit}
          </button>
        </div>
      </form>
    </Reveal>
  );
}

/** Figma capitalises each option ("Քաղաք", "Հիմա") and writes thousands with a comma ("10,000$"). */
function displayOption(label: string): string {
  const formatted = label.replace(/(\d)\.(\d{3})/g, '$1,$2');
  return formatted.charAt(0).toLocaleUpperCase() + formatted.slice(1);
}

function FinderSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  placeholder: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
}) {
  return (
    <Field
      label={label}
      className="gap-2"
      labelClassName="text-[16px] font-medium leading-5 text-neutral-800"
    >
      {(a11y) => (
        <ListboxSelect
          {...a11y}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          triggerClassName={FIELD_CLASSES}
          options={Object.entries(options).map(([key, optionLabel]) => ({
            value: key,
            label: displayOption(optionLabel),
          }))}
        />
      )}
    </Field>
  );
}
