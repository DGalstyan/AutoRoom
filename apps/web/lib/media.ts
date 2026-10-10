/**
 * Server-only fetch of admin-managed `Media` rows (`apps/api`'s
 * `GET /public/media`) — the founder film that backs `FounderVideo` on the
 * Homepage (Section 6) and About (`Ինչպես սկսվեց AutoRoom-ը`), the
 * `GUIDE_REEL` rows behind `/usa`'s S8b "Useful guides" (`UsaGuideReels`),
 * and the `CUSTOMER_STORY` rows behind the Homepage's S7 video wall
 * (`CustomerStoryWall`).
 *
 * Mirrors `lib/team.ts`/`lib/banks.ts`'s fetch-with-safe-fallback contract:
 * never throws. `getFounderVideo` resolves to `null` (an unreachable API or
 * no published `FOUNDER` row) and callers fall back to their own static
 * placeholder; `listGuideReels` resolves to `[]` and the caller renders
 * nothing, same as every other admin-curated grid on the site (`lib/cars.ts`,
 * `lib/faq.ts`) — there's no static "coming soon" stand-in for a whole reel.
 */

import { apiBase } from '@/lib/env';

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

export interface CustomerStory {
  id: string;
  customerName: string | null;
  carLabel: string | null;
  origin: 'CHINA' | 'USA' | null;
  whyChosen: string | null;
  experience: string | null;
  videoUrl: string;
  posterUrl: string | null;
}

interface PublicMediaItem {
  id: string;
  kind: 'FOUNDER' | 'CUSTOMER_STORY' | 'GUIDE_REEL';
  title: string;
  videoUrl: string;
  posterUrl: string | null;
  customerName: string | null;
  carLabel: string | null;
  origin: 'CHINA' | 'USA' | null;
  whyChosen: string | null;
  experience: string | null;
}

interface PublicMediaResponse {
  items: PublicMediaItem[];
  total: number;
}

export async function getFounderVideo(): Promise<FounderVideo | null> {
  const base = apiBase();

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
  const base = apiBase();

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

export async function listCustomerStories(): Promise<CustomerStory[]> {
  const base = apiBase();

  try {
    const res = await fetch(`${base}/public/media?kind=CUSTOMER_STORY`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicMediaResponse;
    return data.items.map((item) => ({
      id: item.id,
      customerName: item.customerName,
      carLabel: item.carLabel,
      origin: item.origin,
      whyChosen: item.whyChosen,
      experience: item.experience,
      videoUrl: item.videoUrl,
      posterUrl: item.posterUrl,
    }));
  } catch {
    return [];
  }
}
