'use server';

import { apiBase } from '@/lib/env';

/**
 * Server Action wrapping `GET /public/availability` (`apps/api`'s
 * unauthenticated slot feed for the "Become a dealer" booking popup's time
 * picker) — same reason `lib/actions/leads.ts` routes `POST /leads` through
 * a Server Action instead of a direct browser fetch: this stays on the
 * trusted `API_INTERNAL_URL` path with no CORS opening needed.
 *
 * `PartnerBookingPopup` calls this once a calendar month is shown, to know
 * which of the fixed daily time chips are already taken. Never throws: an
 * unreachable API or zero rows both resolve to an empty list, and the popup
 * then treats every fixed chip as open (matching `references/pages.md` §5
 * S5's own fallback — "taken=disabled" implies "otherwise available").
 */

export interface PublicAvailabilitySlot {
  id: string;
  branchId: string | null;
  branch: { id: string; name: string; city: string } | null;
  startsAt: string;
  endsAt: string;
  open: boolean;
}

export interface GetAvailabilityParams {
  from: string;
  to: string;
  branchId?: string;
}

export interface PublicAvailability {
  items: PublicAvailabilitySlot[];
  /** Start times (ISO) of dealer meetings already requested — never offered again. */
  takenTimes: string[];
}

export async function getPublicAvailability({
  from,
  to,
  branchId,
}: GetAvailabilityParams): Promise<PublicAvailability> {
  const base = apiBase();
  const params = new URLSearchParams({ from, to });
  if (branchId) params.set('branchId', branchId);

  try {
    const res = await fetch(`${base}/public/availability?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { items: [], takenTimes: [] };
    const data = (await res.json()) as {
      items: PublicAvailabilitySlot[];
      total: number;
      takenTimes?: string[];
    };
    return { items: data.items, takenTimes: data.takenTimes ?? [] };
  } catch {
    return { items: [], takenTimes: [] };
  }
}
