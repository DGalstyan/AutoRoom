/**
 * Time-zone arithmetic for the USA clocks, built on `Intl` alone (no tz library), so every
 * offset and DST answer comes from the browser's own tz database and stays right when the
 * US changes its dates.
 */

/** Minutes `timeZone` is ahead of UTC at `date`: format the instant as that zone's wall clock,
 * read it back as if it were UTC, and diff against the real instant. Correct across DST. */
export function utcOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  // Whole seconds only: the formatter drops milliseconds, so compare against the truncated instant.
  return (asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000;
}

export type DstStatus = 'dst' | 'standard' | 'none';

/**
 * Whether the zone observes daylight saving at all, and if so whether it is in effect at `date`.
 * A zone observes DST when its January and July offsets differ; in effect means "now" is the
 * larger of the two offsets (summer time is the later clock, in either hemisphere).
 */
export function dstStatus(timeZone: string, date: Date): DstStatus {
  const year = date.getUTCFullYear();
  const jan = utcOffsetMinutes(timeZone, new Date(Date.UTC(year, 0, 15, 12)));
  const jul = utcOffsetMinutes(timeZone, new Date(Date.UTC(year, 6, 15, 12)));
  if (jan === jul) return 'none';
  return utcOffsetMinutes(timeZone, date) === Math.max(jan, jul) ? 'dst' : 'standard';
}

/** Whole-hour (or half-hour) difference `timeZone` minus `referenceZone`, in hours. */
export function hoursAhead(timeZone: string, referenceZone: string, date: Date): number {
  return (utcOffsetMinutes(timeZone, date) - utcOffsetMinutes(referenceZone, date)) / 60;
}
