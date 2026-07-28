import type { MessageKey } from '@/lib/i18n';
import {
  BUDGET_OPTIONS,
  type ChipOption,
  type LeadBudget,
  type LeadCountry,
  type LeadTiming,
  type QuizAnswers,
} from '@/lib/lead';
import type { Car, CarUsage, Powertrain } from '@/types/car';

/**
 * "Գտիր քո մեքենան 60 վայրկյանում" — the 5 chip questions and the matching that
 * turns their answers into 3 recommended cars.
 *
 * The quiz labels are intentionally not the Universal Popup's: the spec writes
 * the quiz options in lower case ("հիմա", "քաղաք") and the popup's in sentence
 * case, so they live under separate message keys.
 */

/** Budget chips as USD bounds, used for matching and for the price filters. */
export const BUDGET_RANGES: Record<LeadBudget, [number, number]> = {
  lt10k: [0, 10_000],
  '10-20k': [10_000, 20_000],
  '20-35k': [20_000, 35_000],
  '35k+': [35_000, Number.POSITIVE_INFINITY],
};

export const QUIZ_FUEL_OPTIONS: ChipOption<Powertrain>[] = [
  { value: 'ev', labelKey: 'quiz.fuel.ev' },
  { value: 'hybrid', labelKey: 'quiz.fuel.hybrid' },
  { value: 'benzin', labelKey: 'quiz.fuel.benzin' },
];

export const QUIZ_USAGE_OPTIONS: ChipOption<CarUsage>[] = [
  { value: 'city', labelKey: 'quiz.usage.city' },
  { value: 'family', labelKey: 'quiz.usage.family' },
  { value: 'travel', labelKey: 'quiz.usage.travel' },
];

export const QUIZ_COUNTRY_OPTIONS: ChipOption<LeadCountry>[] = [
  { value: 'usa', labelKey: 'quiz.country.usa' },
  { value: 'china', labelKey: 'quiz.country.china' },
  { value: 'any', labelKey: 'quiz.country.any' },
];

export const QUIZ_TIMING_OPTIONS: ChipOption<LeadTiming>[] = [
  { value: 'now', labelKey: 'quiz.timing.now' },
  { value: '1-3m', labelKey: 'quiz.timing.1-3m' },
  { value: 'browsing', labelKey: 'quiz.timing.browsing' },
];

export interface QuizQuestion {
  field: keyof QuizAnswers;
  labelKey: MessageKey;
  options: ChipOption<string>[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { field: 'budget', labelKey: 'quiz.questions.budget', options: BUDGET_OPTIONS },
  { field: 'fuel', labelKey: 'quiz.questions.fuel', options: QUIZ_FUEL_OPTIONS },
  { field: 'usage', labelKey: 'quiz.questions.usage', options: QUIZ_USAGE_OPTIONS },
  { field: 'country', labelKey: 'quiz.questions.country', options: QUIZ_COUNTRY_OPTIONS },
  { field: 'timing', labelKey: 'quiz.questions.timing', options: QUIZ_TIMING_OPTIONS },
];

export const QUIZ_RESULT_COUNT = 3;

/**
 * Weighted match, not a filter: the quiz must always return 3 cars, so a car
 * that misses one answer still ranks. Budget carries the most weight because it
 * is the answer a buyer is least flexible on; `timing` is deliberately unused —
 * it qualifies the lead for the sales team but says nothing about which car fits.
 */
function score(car: Car, answers: QuizAnswers): number {
  let total = 0;

  if (answers.budget) {
    const [min, max] = BUDGET_RANGES[answers.budget];
    const price = car.estimatedFinalPrice ?? car.price;
    if (price >= min && price <= max) total += 4;
    // Just outside the band is still worth showing; far outside is not.
    else if (price >= min * 0.8 && price <= max * 1.2) total += 1;
  }

  if (answers.fuel && car.powertrain === answers.fuel) total += 3;
  if (answers.usage && car.usage?.includes(answers.usage)) total += 2;

  if (answers.country && answers.country !== 'any') {
    const origin = car.variant.startsWith('usa') ? 'usa' : 'china';
    if (origin === answers.country) total += 2;
  }

  return total;
}

export function recommendCars(answers: QuizAnswers, cars: Car[], limit = QUIZ_RESULT_COUNT): Car[] {
  return (
    cars
      // Construction machinery is never a quiz answer — the quiz asks about cars.
      .filter((car) => car.variant !== 'machinery')
      .map((car) => ({ car, score: score(car, answers) }))
      .sort((a, b) => b.score - a.score || a.car.price - b.car.price)
      .slice(0, limit)
      .map((entry) => entry.car)
  );
}
