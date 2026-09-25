'use server';

/**
 * Server Action backing the "Compare with another model" search field
 * (`CompareModal`). `lib/cars.ts`'s fetchers are server-only
 * (`API_INTERNAL_URL`, the trusted internal-network path — see
 * `lib/actions/leads.ts`'s own comment on why the browser never calls the
 * API directly), so a client component doing an as-you-type search needs a
 * Server Action bridge the same way every other client→API path on this
 * site already does.
 *
 * No dedicated search endpoint exists (`lib/cars.ts`'s own comment on
 * `listMakeModelFacets`), so this reuses that same "one capped unfiltered
 * fetch, filter in memory" approach — the catalogue is small enough that
 * this is cheap per keystroke.
 */

import { listCars } from '@/lib/cars';
import type { CarSummary } from '@/lib/types/car';

export interface CompareSearchResult {
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  imageUrl?: string;
  origin: CarSummary['origin'];
  condition: CarSummary['condition'];
}

function toResult(car: CarSummary): CompareSearchResult {
  return {
    id: car.id,
    slug: car.slug,
    make: car.make,
    model: car.model,
    year: car.year,
    imageUrl: car.images[0]?.url,
    origin: car.origin,
    condition: car.condition,
  };
}

/** Every published car whose make+model contains `query` (case-insensitive),
 * excluding `excludeCarId` — the car already open in the compare picker. */
export async function searchCarsToCompare(
  query: string,
  excludeCarId?: string,
): Promise<CompareSearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const { items } = await listCars({ take: 100 });

  return items
    .filter((car) => car.id !== excludeCarId)
    .filter((car) => `${car.make} ${car.model}`.toLowerCase().includes(trimmed))
    .slice(0, 8)
    .map(toResult);
}
