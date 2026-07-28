/**
 * Number formatting. Grouping is done manually rather than through `Intl` so the
 * server and the browser always agree (an `Intl` locale mismatch would show up as
 * a hydration error) and so the separators match the spec exactly:
 * AMD groups with spaces (`1 049 000 ֏`), USD with commas (`24,900 $`).
 */

/** The dram sign. A currency symbol, not UI copy — it stays out of `hy.json`. */
export const AMD_SYMBOL = '֏';

function group(value: number, separator: string): string {
  const rounded = Math.round(Math.abs(value));
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return value < 0 ? `-${grouped}` : grouped;
}

/** `1049000` → `1 049 000` (no currency symbol — for input fields). */
export function formatAmdNumber(value: number): string {
  return group(value, ' ');
}

/** `1049000` → `1 049 000 ֏`. */
export function formatAmd(value: number): string {
  return `${group(value, ' ')} ${AMD_SYMBOL}`;
}

/** `24900` → `24,900 $`. */
export function formatUsd(value: number): string {
  return `${group(value, ',')} $`;
}

/** `24900` → `24,900` (no symbol). */
export function formatUsdNumber(value: number): string {
  return group(value, ',');
}

/** Read a user-typed amount back out of a formatted field. */
export function parseAmount(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}
