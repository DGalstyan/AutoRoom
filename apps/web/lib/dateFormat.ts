/**
 * Dates shown to visitors, in the numeric `DD.MM.YYYY` form the design uses (e.g. 12.02.2026) —
 * the same in every language. Done by hand rather than with `Intl`: Armenian is missing from some
 * browsers' ICU data and silently falls back to English month names ("Oct 14, 2026").
 */
const two = (value: number) => String(value).padStart(2, '0');

/** A calendar date (a purchase date, a stage date): read in UTC so it never slips a day with the viewer's timezone. */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${two(date.getUTCDate())}.${two(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

/** A moment (a booking time): in the viewer's own timezone, `DD.MM.YYYY, HH:MM`. */
export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${two(date.getDate())}.${two(date.getMonth() + 1)}.${date.getFullYear()}, ${two(date.getHours())}:${two(date.getMinutes())}`;
}
