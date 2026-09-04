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

import type { Car, CarCondition, CarOrigin, CarSummary } from '@/lib/types/car';

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
 * One published car by its public-site slug — the car-detail page's only
 * data source. `null` covers both "no such car" and "not published"
 * identically (the API's own `/public/cars/:slug` already refuses to leak an
 * unpublished row), so the page can 404 either way without distinguishing.
 */
export async function getCarBySlug(slug: string): Promise<Car | null> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/cars/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Car;
  } catch {
    return null;
  }
}

/**
 * "Նմանատիպ առաջարկներ" — an admin can hand-pick this car's `similarCars`
 * from the car's edit form in the admin panel, in display order, up to 8.
 * When they haven't (the common case), falls back to same-origin/powertrain
 * cars ranked by closest price, current car excluded — a single
 * unfiltered-by-price fetch filtered and ranked client-side, since the
 * public list endpoint has no "closest price" sort of its own. Matches the
 * admin form's own "leave empty to fall back to the automatic match" copy.
 */
export async function listSimilarCars(car: Car, limit = 4): Promise<CarSummary[]> {
  if (car.similarCars.length > 0) return car.similarCars.slice(0, limit);

  const { items } = await listCars({ origin: car.origin, take: 100 });

  return items
    .filter((candidate) => candidate.id !== car.id && candidate.powertrain === car.powertrain)
    .sort((a, b) => Math.abs(a.price - car.price) - Math.abs(b.price - car.price))
    .slice(0, limit);
}

/**
 * "Ընթացիկ ակցիաներ" — the /offers page's promotions grid: every published
 * car an admin has given both an `oldPrice` and a `promoDeadline` (either
 * still ahead, rendered as an "Ակցիա" countdown card, or already past,
 * rendered grayscale — `CarCard` itself decides which from `promoDeadline`).
 * Origin-agnostic by design (across China and USA both) — a single
 * unfiltered-by-origin fetch, since there is no dedicated "has a promo"
 * query param on the public list endpoint and the catalogue is small enough
 * that filtering client-side, same as `listSimilarCars`, is the simplest fit.
 * Sorted soonest-deadline-first so an about-to-expire deal surfaces before a
 * newer one with more time left.
 */
export async function listPromoCars(limit = 8): Promise<Car[]> {
  const { items } = await listCars({ take: 100 });

  return items
    .filter((car) => car.oldPrice != null && car.oldPrice > car.price && car.promoDeadline)
    .sort((a, b) => new Date(a.promoDeadline!).getTime() - new Date(b.promoDeadline!).getTime())
    .slice(0, limit);
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
