/**
 * Server-only fetch of the admin-managed homepage map places (`apps/api`'s
 * `home.mapLocations` setting, via `GET /settings/public`) — the countries cars
 * are sourced from. Never throws: an unreachable API or an unset key falls back
 * to the same four places the API seeds by default.
 */

import { apiBase } from '@/lib/env';
export interface MapLocation {
  name: string;
  lat: number;
  lng: number;
}

const DEFAULT_LOCATIONS: MapLocation[] = [
  { name: 'USA', lat: 39.8, lng: -98.6 },
  { name: 'Dubai', lat: 25.2, lng: 55.27 },
  { name: 'Russia', lat: 55.75, lng: 37.62 },
  { name: 'China', lat: 39.9, lng: 116.4 },
];

export async function getMapLocations(): Promise<MapLocation[]> {
  const base = apiBase();
  try {
    const res = await fetch(`${base}/settings/public`, { next: { revalidate: 60 } });
    if (!res.ok) return DEFAULT_LOCATIONS;
    const data = (await res.json()) as { 'home.mapLocations'?: { locations?: MapLocation[] } };
    return data['home.mapLocations']?.locations ?? DEFAULT_LOCATIONS;
  } catch {
    return DEFAULT_LOCATIONS;
  }
}
