/**
 * Server-only fetch of published, admin-managed inventory (`apps/api`'s
 * `GET /public/cars`) — real cars, uploaded and marked "Featured on the
 * homepage" in the admin panel, replacing `lib/data/mockCars.ts` for
 * anything that renders actual inventory (not `QuizPopup`'s recommendation
 * results, which are a quiz-logic concern, not real featured cars, and stay
 * on mock data).
 *
 * `GET /public/cars` is unauthenticated, published-rows-only, and already
 * sends `Cache-Control: public, max-age=60` — `next: { revalidate: 60 }`
 * mirrors that. Never throws: an unreachable API or zero featured cars set
 * in admin both resolve to an empty array, and callers should render nothing
 * (not a placeholder grid pretending to be real inventory) when empty.
 */

import type { Car, CarCondition, CarOrigin } from '@/lib/types/car';

interface PublicCarsResponse {
  items: Car[];
  total: number;
  take: number;
  skip: number;
}

const NO_CARS = { items: [] as Car[], total: 0 };

export async function getFeaturedCars(limit = 4): Promise<Car[]> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/cars?featured=true&take=${limit}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicCarsResponse;
    return data.items;
  } catch {
    // Network error, DNS failure, API not running at build time, etc.
    return [];
  }
}

export interface CarListFilters {
  origin?: CarOrigin;
  condition?: CarCondition;
  make?: string;
  model?: string;
  priceMin?: number;
  priceMax?: number;
  take?: number;
  skip?: number;
}

/**
 * The China (and, later, USA) listing page's filtered grid — mirrors
 * `getFeaturedCars`'s never-throws contract. Callers drive this from the
 * page's `searchParams` rather than fetching client-side, so a filter change
 * is a normal navigation and the data stays server-fetched like everything
 * else in `lib/`, not a second, browser-reachable API surface.
 */
export async function listCars(filters: CarListFilters = {}): Promise<{
  items: Car[];
  total: number;
}> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  const params = new URLSearchParams();
  if (filters.origin) params.set('origin', filters.origin);
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.make) params.set('make', filters.make);
  if (filters.model) params.set('model', filters.model);
  if (filters.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));
  params.set('take', String(filters.take ?? 24));
  if (filters.skip) params.set('skip', String(filters.skip));

  try {
    const res = await fetch(`${base}/public/cars?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return NO_CARS;

    const data = (await res.json()) as PublicCarsResponse;
    return { items: data.items, total: data.total };
  } catch {
    return NO_CARS;
  }
}

/**
 * The full make → model set for one origin, used to populate the `Մակնիշ`/
 * `Մոդել` filter dropdowns from what is actually in stock rather than a
 * hardcoded brand list — an admin adding a new make shows up here with no
 * code change. Derived from a single unfiltered fetch (capped at the API's
 * own `take` ceiling of 100), which the modest size of a real car catalogue
 * makes cheap enough to do on every request rather than adding a dedicated
 * facets endpoint.
 */
export async function listMakeModelFacets(origin: CarOrigin): Promise<Map<string, Set<string>>> {
  const { items } = await listCars({ origin, take: 100 });

  const facets = new Map<string, Set<string>>();
  for (const car of items) {
    const models = facets.get(car.make) ?? new Set<string>();
    models.add(car.model);
    facets.set(car.make, models);
  }
  return facets;
}
