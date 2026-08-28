/**
 * Server-only fetch of published, admin-managed FAQ entries (`apps/api`'s
 * `GET /public/faq`) — replaces the hardcoded `HOMEPAGE_FAQ` list in
 * `lib/data/faq.ts` for the Homepage's FAQ section, and backs the China (and
 * later USA) page's own FAQ section via the `topic` filter.
 *
 * `cache: 'no-store'`, deliberately not ISR (`next: { revalidate }`): a
 * publish/unpublish in admin must show up on the very next page load, not
 * within some caching window — an editor unpublishing something they just
 * noticed was wrong shouldn't still see it live moments later. This does
 * mean every request to a page calling this now hits the API live for this
 * data (and, as a side effect of Next's per-route caching model, for every
 * other fetch on the same route too, since one dynamic fetch on a route
 * makes the whole route render dynamically instead of serving an ISR-cached
 * page). Never throws: an unreachable API or zero published questions both
 * resolve to an empty array, and callers should render nothing (not a
 * hardcoded list) when empty, matching `lib/cars.ts`'s contract — this is
 * why the ten China questions seeded with `answer: null` (see `prisma/seed.ts`)
 * render nothing today: they are real rows awaiting a real answer, not a bug.
 */

import type { FaqItem } from '@/lib/data/faq';

export type FaqTopic = 'CHINA' | 'USA' | 'GENERAL';

interface PublicFaqRecord {
  id: string;
  topic: FaqTopic;
  question: { hy?: string; ru?: string; en?: string };
  answer: { hy?: string; ru?: string; en?: string } | null;
  position: number;
  publishedAt: string | null;
}

interface PublicFaqResponse {
  items: PublicFaqRecord[];
  total: number;
}

export async function getFaq(topic: FaqTopic): Promise<FaqItem[]> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/faq?topic=${topic}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicFaqResponse;
    return data.items
      .filter((item): item is PublicFaqRecord & { answer: { hy: string } } =>
        Boolean(item.answer?.hy),
      )
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ q: item.question.hy ?? '', a: item.answer.hy }));
  } catch {
    // Network error, DNS failure, API not running at build time, etc.
    return [];
  }
}

export async function getHomepageFaq(): Promise<FaqItem[]> {
  return getFaq('GENERAL');
}
