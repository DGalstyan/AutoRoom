import type { MessageKey } from '@/lib/i18n';
import { defaultLocale } from '@/lib/i18n';
import { toE164 } from '@/lib/phone';
import { formatUsd } from '@/lib/format';
import {
  carHref,
  carName,
  type Car,
  type CarColorId,
  type CarUsage,
  type Powertrain,
} from '@/types/car';

/**
 * Lead model shared by every conversion surface: `UniversalPopup`, `QuizPopup`,
 * the per-car prefilled variant, the Contact form and (later) the partner
 * meeting booking.
 *
 * The rule the spec is strict about: the user fills `name` + `phone` and,
 * optionally, chips. Everything under `context` is attached automatically and is
 * never shown as a form field.
 */

export type LeadInterest = 'usa' | 'china' | 'in-stock' | 'machinery' | 'undecided';
export type LeadBudget = 'lt10k' | '10-20k' | '20-35k' | '35k+';
export type LeadFinancing = 'need' | 'no' | 'unsure';
export type LeadTiming = 'now' | '1-3m' | 'browsing';
export type LeadChannel = 'call' | 'whatsapp' | 'viber' | 'telegram';
export type LeadCountry = 'usa' | 'china' | 'any';
export type LeadDevice = 'mobile' | 'tablet' | 'desktop' | 'unknown';

/** The read-only car card locked at the top of the per-car popup variant. */
export interface LeadCarContext {
  name: string;
  vin?: string;
  price?: string;
  image?: string;
  url: string;
}

/** Everything the user optionally chose. All fields are optional by design. */
export interface LeadAnswers {
  interest?: LeadInterest;
  budget?: LeadBudget;
  financing?: LeadFinancing;
  timing?: LeadTiming;
  channel?: LeadChannel;
  /** Per-car variant only, and only for order-only cars. */
  color?: CarColorId;
  comment?: string;
}

export interface QuizAnswers {
  budget?: LeadBudget;
  fuel?: Powertrain;
  usage?: CarUsage;
  country?: LeadCountry;
  timing?: LeadTiming;
}

export interface QuizContext {
  answers: QuizAnswers;
  /** Slugs of the 3 cars the quiz recommended. */
  recommended: string[];
}

export interface LeadPayload {
  name: string;
  /** E.164, e.g. `+37494077757`. */
  phone: string;
  answers: LeadAnswers;
  /** Hidden context — assembled here, never rendered as an input. */
  context: {
    sourcePage: string;
    sourceCta: string;
    car?: LeadCarContext;
    quiz?: QuizContext;
    submittedAt: string;
    locale: string;
    device: LeadDevice;
  };
}

/**
 * Build the locked-card context for the per-car popup variant. Everything that
 * ends up on the lead comes from here, so the CRM always sees the same shape
 * whether the popup opened from a card, a detail page or an on-the-road strip.
 */
export function toLeadCarContext(car: Car): LeadCarContext {
  return {
    name: carName(car),
    vin: car.specs.vin,
    price: formatUsd(car.estimatedFinalPrice ?? car.price),
    image: car.images.exterior[0],
    // Relative today; the API route can prepend the origin when it forwards.
    url: carHref(car),
  };
}

function detectDevice(): LeadDevice {
  if (typeof window === 'undefined') return 'unknown';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export interface BuildLeadInput {
  name: string;
  /** The 8 local digits from `normalizePhoneInput`. */
  phoneDigits: string;
  answers: LeadAnswers;
  sourcePage: string;
  sourceCta: string;
  car?: LeadCarContext;
  quiz?: QuizContext;
}

export function buildLeadPayload(input: BuildLeadInput): LeadPayload {
  const comment = input.answers.comment?.trim();
  return {
    name: input.name.trim(),
    phone: toE164(input.phoneDigits),
    answers: { ...input.answers, comment: comment || undefined },
    context: {
      sourcePage: input.sourcePage,
      sourceCta: input.sourceCta,
      car: input.car,
      quiz: input.quiz,
      submittedAt: new Date().toISOString(),
      locale: defaultLocale,
      device: detectDevice(),
    },
  };
}

/**
 * Submission adapter. Every popup and form goes through this one function, so
 * swapping the API route for a real CRM endpoint is a single-file change.
 * TODO(P7.3): point at the CRM once the endpoint is provided.
 */
export async function submitLead(payload: LeadPayload): Promise<void> {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Lead submission failed with status ${response.status}`);
  }
}

/* ------------------------------------------------------------------ */
/* Chip option lists — one source for the popup, the quiz and any page. */
/* ------------------------------------------------------------------ */

export interface ChipOption<T extends string> {
  value: T;
  labelKey: MessageKey;
}

export const INTEREST_OPTIONS: ChipOption<LeadInterest>[] = [
  { value: 'usa', labelKey: 'universalPopup.interest.usa' },
  { value: 'china', labelKey: 'universalPopup.interest.china' },
  { value: 'in-stock', labelKey: 'universalPopup.interest.inStock' },
  { value: 'machinery', labelKey: 'universalPopup.interest.machinery' },
  { value: 'undecided', labelKey: 'universalPopup.interest.undecided' },
];

export const BUDGET_OPTIONS: ChipOption<LeadBudget>[] = [
  { value: 'lt10k', labelKey: 'universalPopup.budget.lt10k' },
  { value: '10-20k', labelKey: 'universalPopup.budget.10-20k' },
  { value: '20-35k', labelKey: 'universalPopup.budget.20-35k' },
  { value: '35k+', labelKey: 'universalPopup.budget.35k+' },
];

export const FINANCING_OPTIONS: ChipOption<LeadFinancing>[] = [
  { value: 'need', labelKey: 'universalPopup.financing.need' },
  { value: 'no', labelKey: 'universalPopup.financing.no' },
  { value: 'unsure', labelKey: 'universalPopup.financing.unsure' },
];

export const TIMING_OPTIONS: ChipOption<LeadTiming>[] = [
  { value: 'now', labelKey: 'universalPopup.timing.now' },
  { value: '1-3m', labelKey: 'universalPopup.timing.1-3m' },
  { value: 'browsing', labelKey: 'universalPopup.timing.browsing' },
];

export const CHANNEL_OPTIONS: ChipOption<LeadChannel>[] = [
  { value: 'call', labelKey: 'universalPopup.channel.call' },
  { value: 'whatsapp', labelKey: 'universalPopup.channel.whatsapp' },
  { value: 'viber', labelKey: 'universalPopup.channel.viber' },
  { value: 'telegram', labelKey: 'universalPopup.channel.telegram' },
];

/** Instrumental form used in the success line ("կկապվի <զանգով>"). */
export const CHANNEL_INSTRUMENTAL: Record<LeadChannel, MessageKey> = {
  call: 'universalPopup.channelInstrumental.call',
  whatsapp: 'universalPopup.channelInstrumental.whatsapp',
  viber: 'universalPopup.channelInstrumental.viber',
  telegram: 'universalPopup.channelInstrumental.telegram',
};

export const COLOR_OPTIONS: { value: CarColorId; labelKey: MessageKey; hex: string }[] = [
  { value: 'white', labelKey: 'car.color.white', hex: '#F2F3F5' },
  { value: 'black', labelKey: 'car.color.black', hex: '#111114' },
  { value: 'gray', labelKey: 'car.color.gray', hex: '#8A8F98' },
  { value: 'blue', labelKey: 'car.color.blue', hex: '#2F6BFF' },
  { value: 'red', labelKey: 'car.color.red', hex: '#E4002B' },
];
