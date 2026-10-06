/**
 * Arrival date for an on-the-road car: today + its delivery ETA, as a plain
 * `YYYY-MM-DD` (local calendar day — the visitor's "it should arrive on …").
 * `undefined` when the car has no ETA, so the lead simply omits the field.
 */
export function arrivalDateFromEta(
  etaDays: number | null | undefined,
  now: Date = new Date(),
): string | undefined {
  if (etaDays === null || etaDays === undefined || !Number.isFinite(etaDays) || etaDays < 0) {
    return undefined;
  }
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + Math.round(etaDays));
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** `2026-11-05` → `05.11.2026` (locale-neutral, so no `Intl` fallback surprises). */
export function formatArrivalDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}.${m}.${y}` : iso;
}
