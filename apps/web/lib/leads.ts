/**
 * Lead types + submission adapter shared by `UniversalPopup` and `QuizPopup`.
 * See `.claude/skills/autoroom-website/references/components.md` → `UniversalPopup`.
 */

export type LeadInterest = 'usa' | 'china' | 'in-stock' | 'machinery' | 'undecided';
export type LeadBudget = 'lt10k' | '10-20k' | '20-35k' | '35k+';
export type LeadFinancing = 'need' | 'no' | 'unsure';
export type LeadTiming = 'now' | '1-3m' | 'browsing';
export type LeadChannel = 'call' | 'whatsapp' | 'viber' | 'telegram';
export type LeadDevice = 'mobile' | 'tablet' | 'desktop';

export interface LeadCarContext {
  name: string;
  vin?: string;
  price?: string;
  image?: string;
  url: string;
}

/** What the visitor actually filled in. */
export interface LeadAnswers {
  name: string;
  phone: string;
  interest?: LeadInterest;
  budget?: LeadBudget;
  financing?: LeadFinancing;
  timing?: LeadTiming;
  channel?: LeadChannel;
  comment?: string;
  /** Per-car variant only — order-only colour choice. */
  color?: string;
}

/** Auto-attached, never filled by the visitor. */
export interface LeadHiddenContext {
  sourcePage: string;
  sourceCta: string;
  car?: { name: string; vin?: string };
  timestamp: string;
  locale: string;
  device: LeadDevice;
  /** Present when the lead came out of the Quiz flow. */
  quizAnswers?: Record<string, string>;
}

export interface LeadPayload {
  answers: LeadAnswers;
  hidden: LeadHiddenContext;
}

export function detectDevice(): LeadDevice {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Submits a lead. No backend endpoint exists yet — this logs the fully
 * assembled payload (visible + hidden context) so downstream wiring is a
 * one-line swap.
 *
 * TODO(forms-and-leads): replace with `POST /leads` against the real API
 * once it exists (see `apps/api`), including retry/error surfacing in the UI.
 */
export async function submitLead(payload: LeadPayload): Promise<{ ok: true }> {
  console.log('[AutoRoom lead submit]', payload);
  return { ok: true };
}

export const CHANNEL_INSTRUMENTAL: Record<LeadChannel, string> = {
  call: 'զանգով',
  whatsapp: 'WhatsApp-ով',
  viber: 'Viber-ով',
  telegram: 'Telegram-ով',
};
