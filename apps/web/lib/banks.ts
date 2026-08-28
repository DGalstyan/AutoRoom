/**
 * Server-only fetch of the admin-managed partner-bank grid (`apps/api`'s
 * `GET /public/banks`) — the China (and USA) page's financing section. One
 * row is flagged `inHouse`: AutoRoom's own pre-arrival offer, which has no
 * `loanUrl` and opens the financing detail popup rather than a bank's site.
 *
 * Mirrors `lib/cars.ts`/`lib/branding.ts`'s fetch-with-safe-fallback
 * contract: never throws, and an unreachable API or zero configured banks
 * both resolve to an empty array — callers should render nothing (not a
 * hardcoded bank list) when empty.
 */

export interface Bank {
  id: string;
  name: string;
  logoUrl: string | null;
  loanUrl: string | null;
  inHouse: boolean;
  position: number;
}

interface PublicBanksResponse {
  items: Bank[];
  total: number;
}

export async function getBanks(): Promise<Bank[]> {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/banks`, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicBanksResponse;
    return data.items;
  } catch {
    return [];
  }
}
