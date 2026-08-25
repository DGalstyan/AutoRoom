/**
 * Server-only fetch of the admin-managed branding identity (`apps/api`'s
 * `branding.identity` setting) — used to pick a real logo for the Header once
 * one has been uploaded. Nobody has uploaded one yet in production
 * (`logoLightUrl`/`logoDarkUrl` are both `null`), so every caller must treat
 * the result as optional and fall back to the text wordmark.
 *
 * `GET /settings/public` is unauthenticated and already sends
 * `Cache-Control: public, max-age=60` (see `apps/api/src/routes/settings.ts`)
 * — `next: { revalidate: 60 }` mirrors that instead of inventing a different
 * cache lifetime.
 *
 * This must never throw: the API can be unreachable at build time, in a
 * preview environment, or if the container simply isn't up yet, and a
 * missing logo is fine where a crashed page is not.
 */

export interface BrandingLogos {
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
}

interface PublicSettingsResponse {
  'branding.identity'?: {
    brandName: string;
    logoLightUrl: string | null;
    logoDarkUrl: string | null;
    faviconUrl: string | null;
  };
}

const NO_LOGO: BrandingLogos = { logoLightUrl: null, logoDarkUrl: null };

export async function getBrandingLogos(): Promise<BrandingLogos> {
  // Server-only. Deliberately not `NEXT_PUBLIC_...` — this fetch only ever
  // runs in the RSC render, never in the browser bundle. Dev-friendly default
  // matches the API's own `PUBLIC_API_URL` default; the production value is
  // wired via `docker-compose.prod.yml`, not here.
  const base = process.env.SETTINGS_API_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/settings/public`, { next: { revalidate: 60 } });
    if (!res.ok) return NO_LOGO;

    const data = (await res.json()) as PublicSettingsResponse;
    const identity = data['branding.identity'];
    if (!identity) return NO_LOGO;

    return { logoLightUrl: identity.logoLightUrl, logoDarkUrl: identity.logoDarkUrl };
  } catch {
    // Network error, DNS failure, API not running at build time, etc.
    return NO_LOGO;
  }
}
