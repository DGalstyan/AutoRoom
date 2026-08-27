/**
 * Armenia's outline and each branch's position on it, for `BranchMap`'s
 * interactive map. There is no Figma source for this (the Homepage's
 * "Միշտ քո կողքին" section has no per-branch map design at all — see
 * `BranchMap.tsx`'s own comment), so this is built from real geographic
 * data rather than hand-drawn:
 *
 * - Country outline: simplified border polygon for Armenia (ISO `ARM`),
 *   projected from real lng/lat to a 397×440 viewBox using an equirectangular
 *   projection scaled by cos(latitude) — flat map projections stretch
 *   east-west distances at higher latitudes, so this correction keeps the
 *   silhouette's proportions honest rather than visibly too wide.
 * - Branch coordinates: geocoded (OpenStreetMap Nominatim) city centers for
 *   Yerevan, Armavir, and Vagharshapat/Ejmiatsin — the three real cities in
 *   `lib/data/branches.ts` — not estimated by eye.
 *
 * `left`/`top` are percentages of the viewBox (`x / 396.9 * 100`,
 * `y / 440 * 100`), so pins stay correctly placed regardless of the
 * container's rendered size — never hardcode pixel positions here.
 */

export const ARMENIA_OUTLINE_VIEWBOX = '0 0 396.9 440';

export const ARMENIA_OUTLINE_PATH =
  'M 20.0,44.9 L 189.7,20.0 L 215.0,61.9 L 261.5,89.5 L 236.9,129.6 L 301.9,184.3 L 267.5,235.1 L 319.3,278.5 L 374.2,304.6 L 376.9,415.3 L 332.7,420.0 L 282.8,327.7 L 283.4,303.1 L 229.4,303.4 L 193.3,260.6 L 167.9,264.9 L 119.8,218.4 L 29.0,178.7 L 40.7,101.0 L 20.0,44.9 Z';

/** Keyed by `Branch['id']` from `lib/data/branches.ts`. */
export const BRANCH_MAP_POSITIONS: Record<string, { left: number; top: number }> = {
  yerevan: { left: 33.64, top: 43.36 },
  armavir: { left: 19.07, top: 44.16 },
  ejmiatsin: { left: 26.88, top: 43.91 },
};
