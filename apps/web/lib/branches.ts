/**
 * Server-only fetch of the admin-managed branch list (`apps/api`'s
 * `GET /public/branches`) — replaces the hardcoded `BRANCHES` constant
 * `lib/data/branches.ts` used to be the "single source of truth" for.
 *
 * That file was never actually wired to the backend: `BranchMap`,
 * `ArmeniaMap`, `ContactInfo`, and `BranchCards` all imported its static
 * array directly, so an admin editing "Branches" in the panel (name,
 * address, phone, hours, and — since a recent pass — a photo) had zero
 * effect on the live site. This is that wiring.
 *
 * `next: { revalidate: 300 }` mirrors the API's own
 * `Cache-Control: public, max-age=300` on this route, same convention
 * `lib/team.ts`/`lib/banks.ts` already follow. Never throws: an unreachable
 * API or zero configured branches both resolve to an empty array, and
 * callers should render nothing (not the old hardcoded list) when empty.
 */

import { apiBase } from '@/lib/env';
import { getLocale, type Locale } from '@/lib/i18n';

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
  /** Google Maps link an admin set for this branch — falls back to a
   * generated search-by-address URL when not set (see `branchMapsUrl`). */
  mapUrl: string | null;
  photoUrl: string | null;
  /** Per-language wording from the admin; `getBranches` applies the visitor's language. */
  translations?: Partial<
    Record<'ru' | 'en', { name?: string; city?: string; address?: string; hours?: string }>
  > | null;
}

interface PublicBranchResponse {
  items: Branch[];
  total: number;
}

/** `branch` in the visitor's language: each translated field replaces the Armenian one, the rest stays. */
export function localizeBranch(branch: Branch, locale: Locale): Branch {
  const text = locale === 'hy' ? undefined : branch.translations?.[locale];
  if (!text) return branch;
  return {
    ...branch,
    name: text.name || branch.name,
    city: text.city || branch.city,
    address: text.address || branch.address,
    hours: text.hours || branch.hours,
  };
}

export async function getBranches(): Promise<Branch[]> {
  const base = apiBase();

  try {
    const res = await fetch(`${base}/public/branches`, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicBranchResponse;
    const locale = await getLocale();
    return data.items.map((branch) => localizeBranch(branch, locale));
  } catch {
    return [];
  }
}

/** `tel:` hrefs must not contain spaces. */
export function branchTelHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

/** The admin's own `mapUrl` when set; otherwise a Google Maps search built
 * from the address so "Ուղղություն" never links nowhere. */
export function branchMapsUrl(branch: Pick<Branch, 'mapUrl' | 'address' | 'city'>): string {
  if (branch.mapUrl) return branch.mapUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${branch.address}, ${branch.city}, Armenia`,
  )}`;
}
