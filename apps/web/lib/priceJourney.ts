/**
 * Pure math for `PriceJourney`'s "a + b + c + d = total" row — kept out of
 * the component so the invariant (the total is always the sum of the chips
 * shown above it) is one small, testable function.
 */

import type { PriceChip } from '@/lib/types/car';
import { formatUsd } from '@/lib/types/car';

/** Sum of the chips' USD amounts; a non-finite amount counts as 0 rather than turning the total into `NaN`. */
export function sumChips(chips: Pick<PriceChip, 'amount'>[]): number {
  return chips.reduce((sum, chip) => sum + (Number.isFinite(chip.amount) ? chip.amount : 0), 0);
}

/** The count-up value at `progress` (clamped to 0–1) — exactly `total` at 1. */
export function countUpValue(total: number, progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return clamped >= 1 ? total : Math.round(total * clamped);
}

/** `"12,000 $ + 3,500 $ + … = 20,000 $"`. `displayedTotal` defaults to the real sum. */
export function buildPriceFormula(
  chips: Pick<PriceChip, 'amount'>[],
  displayedTotal: number = sumChips(chips),
): string {
  return `${chips.map((chip) => formatUsd(chip.amount)).join(' + ')} = ${formatUsd(displayedTotal)}`;
}
