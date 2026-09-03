/**
 * Server-only fetch of the admin-managed "Մեր թիմը" grid (`apps/api`'s
 * `GET /public/team`) — the About page's team section.
 *
 * Mirrors `lib/banks.ts`/`lib/cars.ts`'s fetch-with-safe-fallback contract:
 * never throws, and an unreachable API or zero configured members both
 * resolve to an empty array — callers should render nothing (not a
 * hardcoded team list) when empty.
 */

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
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${base}/public/team`, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const data = (await res.json()) as PublicTeamResponse;
    return data.items;
  } catch {
    return [];
  }
}
