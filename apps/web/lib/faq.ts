/**
 * Server-only fetch of published, admin-managed FAQ entries (`apps/api`'s
 * `GET /public/faq`) — replaces the hardcoded `HOMEPAGE_FAQ` list in
 * `lib/data/faq.ts` for the Homepage's FAQ section.
 *
 * Scoped to `topic=GENERAL`: China's own FAQ (`CHINA_FAQ_QUESTIONS`) is a
 * separate, page-specific list meant for the future `/china` page, not the
 * Homepage — fetching without a topic filter would pull in whatever gets
 * published under the China topic too, which isn't what Homepage content
 * should show.
 *
 * `cache: 'no-store'`, deliberately not ISR (`next: { revalidate }`): a
 * publish/unpublish in admin must show up on the very next page load, not
 * within some caching window — an editor unpublishing something they just
 * noticed was wrong shouldn't still see it live moments later. This does
 * mean every request to `/` now calls the API live for this data (and, as a
 * side effect of Next's per-route caching model, for Featured Cars and the
 * branding logo too, since one dynamic fetch on a route makes the whole
 * route render dynamically instead of serving an ISR-cached page). Never
 * throws: an unreachable API or zero published questions both resolve to an
 * empty array, and callers should render nothing (not the old hardcoded
 * list) when empty, matching `lib/cars.ts`'s contract.
 */

import type { FaqItem } from '@/lib/data/faq';

interface PublicFaqRecord {
  id: string;
  topic: 'CHINA' | 'USA' | 'GENERAL';
  question: { hy?: string; ru?: string; en?: string };
  answer: { hy?: string; ru?: string; en?: string } | null;
  position: number;
  publishedAt: string | null;
}

interface PublicFaqResponse {
  items: PublicFaqRecord[];
  total: number;
}

export async function getHomepageFaq(): Promise<FaqItem[]> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/faq?topic=GENERAL`, {
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
