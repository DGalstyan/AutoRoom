/** Shared by `lib/settings.ts` (reads it server-side) and the client-only
 * `MaintenanceNotice` (writes it) — its own file with no `next/headers`
 * import, so the client component doesn't drag a server-only module into
 * its bundle just to read this one string. */
export const MAINTENANCE_PREVIEW_COOKIE = 'maintenance-preview';
