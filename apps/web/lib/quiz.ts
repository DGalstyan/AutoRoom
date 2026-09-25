/**
 * Shared "Գտիր քո մեքենան 60 վայրկյանում" quiz logic — the 5-question shape
 * and the (placeholder) recommendation matcher, used by both `QuizPopup`
 * (the step-by-step chip modal) and `CompareCarFinder` (the same 5 questions
 * as one inline form on `/compare`, per Figma node 393:530). Pulled out of
 * `QuizPopup.tsx` rather than duplicated, since both need the exact same
 * answer shape to hand off to `UniversalPopup`'s `quizAnswers`.
 */

import { MOCK_CARS } from '@/lib/data/mockCars';
import type { Car } from '@/lib/types/car';
import type { LeadBudget } from '@/lib/leads';

export type QuizFuel = 'ev' | 'hybrid' | 'benzin';
export type QuizUsage = 'city' | 'family' | 'travel';
export type QuizCountry = 'usa' | 'china' | 'any';
export type QuizTiming = 'now' | '1-3m' | 'browsing';

export interface QuizAnswers {
  budget?: LeadBudget;
  fuel?: QuizFuel;
  usage?: QuizUsage;
  country?: QuizCountry;
  timing?: QuizTiming;
}

export const QUIZ_QUESTION_ORDER = ['budget', 'fuel', 'usage', 'country', 'timing'] as const;
export type QuizQuestionKey = (typeof QUIZ_QUESTION_ORDER)[number];

const FUEL_TO_POWERTRAIN: Record<QuizFuel, Car['powertrain']> = {
  ev: 'EV',
  hybrid: 'HYBRID',
  benzin: 'BENZIN',
};

export function recommendCars(answers: QuizAnswers): Car[] {
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

/** `Object.entries` on a `QuizAnswers`, dropping unset questions — the shape
 * `UniversalPopup`'s `quizAnswers` prop takes. */
export function serializeQuizAnswers(answers: QuizAnswers): Record<string, string> {
  return Object.fromEntries(
    Object.entries(answers).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string>;
}
