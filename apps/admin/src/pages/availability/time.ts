/**
 * Local-time helpers shared by the diary screens.
 *
 * Everything the API stores is UTC; everything a person reads is local. These
 * are the conversions, in one place, because a slot rendered an hour out is the
 * kind of bug that only shows up in someone else's time zone.
 */

/** `Date` → `YYYY-MM-DD` in local time, for a `<input type="date">`. */
export function toDateInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** `<input type="datetime-local">` wants `YYYY-MM-DDTHH:mm`, local, no suffix. */
export function toDateTimeInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** The local calendar day an instant falls on — the key slots are grouped by. */
export function dayKey(iso: string): string {
  return toDateInput(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** `2027-03-01` → `Monday, 1 March 2027`, parsed as a local date, not UTC. */
export function formatDayHeading(key: string): string {
  const [year, month, day] = key.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * The browser's offset in the sign the API expects — `getTimezoneOffset`
 * reports minutes to *add* to local to reach UTC, which is backwards from how
 * offsets are normally written (Yerevan is +240, not -240).
 */
export function browserOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
] as const;
