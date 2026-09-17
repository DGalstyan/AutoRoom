/**
 * Server-only fetch of admin-managed `Media` rows (`apps/api`'s
 * `GET /public/media`) — the founder film that backs `FounderVideo` on the
 * Homepage (Section 6) and About (`Ինչպես սկսվեց AutoRoom-ը`), and the
 * `GUIDE_REEL` rows behind `/usa`'s S8b "Useful guides" (`UsaGuideReels`).
 *
 * Mirrors `lib/team.ts`/`lib/banks.ts`'s fetch-with-safe-fallback contract:
 * never throws. `getFounderVideo` resolves to `null` (an unreachable API or
 * no published `FOUNDER` row) and callers fall back to their own static
 * placeholder; `listGuideReels` resolves to `[]` and the caller renders
 * nothing, same as every other admin-curated grid on the site (`lib/cars.ts`,
 * `lib/faq.ts`) — there's no static "coming soon" stand-in for a whole reel.
 */

export interface FounderVideo {
  title: string;
  videoUrl: string;
  posterUrl: string | null;
}

export interface GuideReel {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl: string | null;
}

interface PublicMediaItem {
  id: string;
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

export async function listGuideReels(): Promise<GuideReel[]> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/media?kind=GUIDE_REEL`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicMediaResponse;
    return data.items.map((item) => ({
      id: item.id,
      title: item.title,
      videoUrl: item.videoUrl,
      posterUrl: item.posterUrl,
    }));
  } catch {
    return [];
  }
}
