/**
 * Server-only fetch of the admin-managed photo collage (`apps/api`'s
 * `GET /public/gallery`) — the About page's `PhotoGallery`, right below the
 * team grid.
 *
 * Mirrors `lib/team.ts`'s fetch-with-safe-fallback contract: never throws,
 * and an unreachable API or zero configured images both resolve to an empty
 * array — `PhotoGallery` fills any slot this doesn't cover with its own
 * bundled default photo, so an empty result still renders a complete grid.
 *
 * `cache: 'no-store'` rather than a `revalidate` window, same reasoning as
 * `lib/settings.ts`'s `isMaintenanceMode`: an admin who just uploaded a tile
 * expects to see it on the *next* page load, not up to 5 minutes later, and
 * this costs nothing — the About page (like every page) is already forced
 * fully dynamic by `RootLayout`'s `cookies()` call (`getLocale()`), so
 * there's no static/ISR caching here to lose.
 */

export interface GalleryImage {
  id: string;
  imageUrl: string;
  position: number;
}

interface PublicGalleryResponse {
  items: GalleryImage[];
  total: number;
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/gallery`, { cache: 'no-store' });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicGalleryResponse;
    return data.items;
  } catch {
    return [];
  }
}
