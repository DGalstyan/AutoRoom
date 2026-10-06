/**
 * Recognising placeholder ("demo") VIN and auction-lot values, so they can be
 * removed from production data without touching real vehicles.
 *
 * Deliberately conservative: only values that are *obviously* placeholders are
 * "demo". A VIN that merely looks odd (wrong length, …) is only a "suspect" —
 * reported for a human to look at, never cleared automatically.
 */

/** Values that shipped in the codebase's own sample data (`apps/web/lib/data/mockCars.ts`). */
export const KNOWN_DEMO_VINS = [
  '5YJ3E1EA*XF000000',
  '1FTFW1E5*NF000000',
  // Sample cars found on production (admin records are left as they are; the public API hides these).
  '5J6RW2H8*ME000000',
  'KM8J3CA*PU000000',
  '4T1B11HK*PU000000',
];
export const KNOWN_DEMO_LOTS = ['IAAI-48213077', 'COP-55621034'];

const PLACEHOLDER_WORDS =
  /(demo|test|sample|example|placeholder|dummy|fake|lorem|n\/a|^tbd$|^none$|^null$)/i;

const norm = (value: string | null | undefined) => (value ?? '').trim().toUpperCase();

export type DemoVerdict = { kind: 'demo' | 'suspect' | 'ok'; reason?: string };

export function classifyVin(
  input: string | null | undefined,
  extraDemo: string[] = [],
): DemoVerdict {
  const vin = norm(input);
  if (!vin) return { kind: 'ok' };

  const known = [...KNOWN_DEMO_VINS, ...extraDemo].map((v) => v.toUpperCase());
  if (known.includes(vin)) return { kind: 'demo', reason: 'known sample VIN' };
  if (vin.includes('*')) return { kind: 'demo', reason: 'masked VIN (contains *)' };
  if (/(.)\1{6,}/.test(vin)) return { kind: 'demo', reason: 'repeated character run' };
  if (/0{6}$/.test(vin)) return { kind: 'demo', reason: 'serial part is all zeros' };
  if (PLACEHOLDER_WORDS.test(vin)) return { kind: 'demo', reason: 'placeholder word' };

  // A real VIN is 17 characters from A–Z/0–9 excluding I, O, Q.
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))
    return { kind: 'suspect', reason: 'not a valid 17-character VIN' };
  return { kind: 'ok' };
}

export function classifyLot(
  input: string | null | undefined,
  extraDemo: string[] = [],
): DemoVerdict {
  const lot = norm(input);
  if (!lot) return { kind: 'ok' };

  const known = [...KNOWN_DEMO_LOTS, ...extraDemo].map((v) => v.toUpperCase());
  if (known.includes(lot)) return { kind: 'demo', reason: 'known sample lot' };
  if (/^[0X]+$/.test(lot.replace(/[^0-9A-Z]/g, '')))
    return { kind: 'demo', reason: 'zeros / X placeholder' };
  if (/(.)\1{7,}/.test(lot)) return { kind: 'demo', reason: 'repeated character run' };
  if (PLACEHOLDER_WORDS.test(lot)) return { kind: 'demo', reason: 'placeholder word' };
  return { kind: 'ok' };
}

/**
 * What a *visitor* may see of a car's VIN and lot: a recognised demo/placeholder
 * value is withheld (`null`), anything else passes through untouched. The admin
 * keeps the stored value — this only filters the public API's output, so
 * sample records never show a fake identification number on the website.
 */
export function publicVinLot<T extends { vin?: string | null; lotNumber?: string | null }>(
  car: T,
): T {
  const hideVin = classifyVin(car.vin).kind === 'demo';
  const hideLot = classifyLot(car.lotNumber).kind === 'demo';
  if (!hideVin && !hideLot) return car;
  return { ...car, vin: hideVin ? null : car.vin, lotNumber: hideLot ? null : car.lotNumber };
}
