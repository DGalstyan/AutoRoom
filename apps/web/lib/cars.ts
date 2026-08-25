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

import type { Car } from '@/lib/types/car';

interface PublicCarsResponse {
  items: Car[];
  total: number;
  take: number;
  skip: number;
}

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
