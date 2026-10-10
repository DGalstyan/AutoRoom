/**
 * Pure math for `PriceJourney`'s "a + b + c + d = total" row — kept out of
 * the component so the invariant (the total is always the sum of the chips
 * shown above it) is one small, testable function.
 */

import type { PriceChip } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';

type Amount = Pick<PriceChip, 'amount'>;

function finiteAmount(chip: Amount): number {
  return Number.isFinite(chip.amount) ? chip.amount : 0;
}

/** Sum of the chips' USD amounts; a non-finite amount counts as 0 rather than turning the total into `NaN`. */
export function sumChips(chips: Amount[]): number {
  return chips.reduce((sum, chip) => sum + finiteAmount(chip), 0);
}

/**
 * Splits the chips into the addends and the total they add up to.
 *
 * Admin often enters the last chip as the result itself ("Total in Armenia" 83,200 after
 * 45,000 + 37,000 + 1,200). Adding that on top double-counts the car (166,400). So when the
 * last chip equals the sum of the ones before it, it is the total and not an addend;
 * otherwise every chip is an addend and the total is their sum. A rounding slack of $1 keeps
 * hand-typed figures from missing by a dollar.
 */
export function resolveJourney<T extends Amount>(chips: T[]): { addends: T[]; total: number } {
  const last = chips[chips.length - 1];
  if (chips.length >= 3 && last) {
    const rest = chips.slice(0, -1);
    const restSum = sumChips(rest);
    if (restSum > 0 && Math.abs(finiteAmount(last) - restSum) <= 1) {
      return { addends: rest, total: finiteAmount(last) };
    }
  }
  return { addends: chips, total: sumChips(chips) };
}

/** The count-up value at `progress` (clamped to 0–1) — exactly `total` at 1. */
export function countUpValue(total: number, progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return clamped >= 1 ? total : Math.round(total * clamped);
}

/** `"12,000 $ + 3,500 $ + 9,800 $"` — the addends alone, shown under the total. */
export function buildAddends(chips: Amount[]): string {
  return resolveJourney(chips)
    .addends.map((chip) => formatUsd(chip.amount))
    .join(' + ');
}

/** `"12,000 $ + 3,500 $ + … = 20,000 $"`. `displayedTotal` defaults to the real total. */
export function buildPriceFormula(
  chips: Amount[],
  displayedTotal: number = resolveJourney(chips).total,
): string {
  return `${buildAddends(chips)} = ${formatUsd(displayedTotal)}`;
}
