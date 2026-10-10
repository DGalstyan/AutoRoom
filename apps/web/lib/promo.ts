/**
 * Promotion lifecycle, derived from `promoDeadline` and never stored: a promotion is
 * `active`, `ending-soon` (inside the last 48 hours) or `expired`. Everything here is pure so the
 * same answer drives the card badge, the countdown, the detail page and the lead button.
 */
import type { Locale } from '@/lib/i18n';
import type { LocalizedText } from '@/lib/types/car';

export type PromoStatus = 'active' | 'ending-soon' | 'expired';

export const ENDING_SOON_HOURS = 48;
/** An ended promotion stays in the "Past" tab for this long, then drops off the list (its page stays reachable). */
export const ARCHIVE_DAYS = 90;

const toMs = (deadline: string | Date): number => new Date(deadline).getTime();

export function promoStatus(
  deadline: string | Date | null | undefined,
  now: number = Date.now(),
): PromoStatus | null {
  if (!deadline) return null;
  const end = toMs(deadline);
  if (Number.isNaN(end)) return null;
  const left = end - now;
  if (left <= 0) return 'expired';
  return left <= ENDING_SOON_HOURS * 3_600_000 ? 'ending-soon' : 'active';
}

/** Ended more than `ARCHIVE_DAYS` ago: no longer listed. */
export function isArchived(deadline: string | Date, now: number = Date.now()): boolean {
  return now - toMs(deadline) > ARCHIVE_DAYS * 86_400_000;
}

export interface CountdownLabels {
  days: string;
  hours: string;
  minutes: string;
  lessThanMinute: string;
}

/**
 * `12 օր 3 ժ 5 ր` — leading zero units are dropped (`3 ժ 5 ր`, `5 ր`) and the last minute reads
 * "less than a minute", so the label never shows `0 օր 0 ժ 0 ր` while the promotion is still on.
 */
export function formatCountdown(
  deadline: string | Date,
  labels: CountdownLabels,
  now: number = Date.now(),
): string {
  const left = toMs(deadline) - now;
  if (left <= 0) return '';
  const totalMinutes = Math.floor(left / 60_000);
  if (totalMinutes < 1) return labels.lessThanMinute;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${labels.days}`);
  if (days > 0 || hours > 0) parts.push(`${hours} ${labels.hours}`);
  parts.push(`${minutes} ${labels.minutes}`);
  return parts.join(' ');
}

/** `{ amount, percent }` saved against the old price; null when there is no real discount. */
export function savings(
  price: number,
  oldPrice: number | null | undefined,
): { amount: number; percent: number } | null {
  if (oldPrice == null || oldPrice <= price) return null;
  return { amount: oldPrice - price, percent: Math.round(((oldPrice - price) / oldPrice) * 100) };
}

/** One bullet per non-empty line of the admin's text in the visitor's language (Armenian if missing); `fallback` when none. */
export function promoPoints(
  text: LocalizedText | null | undefined,
  locale: Locale,
  fallback: string[],
): string[] {
  const raw = text?.[locale] || text?.hy || '';
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : fallback;
}
