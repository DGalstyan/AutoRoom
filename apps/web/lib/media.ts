/**
 * Server-only fetch of admin-managed `Media` rows (`apps/api`'s
 * `GET /public/media`) — currently just the founder film that backs
 * `FounderVideo` on the Homepage (Section 6) and About (`Ինչպես սկսվեց
 * AutoRoom-ը`).
 *
 * Mirrors `lib/team.ts`/`lib/banks.ts`'s fetch-with-safe-fallback contract:
 * never throws, and an unreachable API or no published `FOUNDER` row both
 * resolve to `null` — callers fall back to their own static placeholder
 * rather than rendering nothing.
 */

export interface FounderVideo {
  title: string;
  videoUrl: string;
  posterUrl: string | null;
}

interface PublicMediaItem {
  kind: 'FOUNDER' | 'CUSTOMER_STORY' | 'GUIDE_REEL';
  title: string;
  videoUrl: string;
  posterUrl: string | null;
}

interface PublicMediaResponse {
  items: PublicMediaItem[];
  total: number;
}

export async function getFounderVideo(): Promise<FounderVideo | null> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/media?kind=FOUNDER`, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const data = (await res.json()) as PublicMediaResponse;
    const item = data.items[0];
    if (!item) return null;

    return { title: item.title, videoUrl: item.videoUrl, posterUrl: item.posterUrl };
  } catch {
    return null;
  }
}
