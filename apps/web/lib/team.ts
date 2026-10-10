/**
 * Server-only fetch of the admin-managed "Մեր թիմը" grid (`apps/api`'s
 * `GET /public/team`) — the About page's team section.
 *
 * Mirrors `lib/banks.ts`/`lib/cars.ts`'s fetch-with-safe-fallback contract:
 * never throws, and an unreachable API or zero configured members both
 * resolve to an empty array — callers should render nothing (not a
 * hardcoded team list) when empty.
 *
 * `cache: 'no-store'` — see `lib/gallery.ts`'s matching comment: the same
 * admin screen edits this and the collage right below it, so a saved change
 * here should show up on the next load too, at no real cost since the About
 * page is already fully dynamic.
 */

import { apiBase } from '@/lib/env';

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  photoUrl: string | null;
  linkedinUrl: string | null;
  position: number;
}

interface PublicTeamResponse {
  items: TeamMember[];
  total: number;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const base = apiBase();

  try {
    const res = await fetch(`${base}/public/team`, { cache: 'no-store' });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicTeamResponse;
    return data.items;
  } catch {
    return [];
  }
}
