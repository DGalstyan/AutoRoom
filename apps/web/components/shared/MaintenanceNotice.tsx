'use client';

import { MAINTENANCE_PREVIEW_COOKIE } from '@/lib/maintenancePreviewCookie';

/** The full-page notice `RootLayout` swaps in for every route while
 * `features.toggles.maintenanceMode` is on — see its own comment.
 *
 * Double-clicking the heading is a deliberately undocumented escape hatch:
 * it drops a session cookie `RootLayout` checks (`hasMaintenancePreview`)
 * and reloads, so whoever knows the trick can preview the real site while
 * every other visitor still sees this notice — no separate login flow for
 * what's meant to be a quick, low-stakes look. */
export function MaintenanceNotice({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center text-white">
      <h1
        className="font-display text-h2 font-bold"
        onDoubleClick={() => {
          document.cookie = `${MAINTENANCE_PREVIEW_COOKIE}=1; path=/`;
          window.location.reload();
        }}
      >
        {heading}
      </h1>
      <p className="max-w-md text-body text-muted">{body}</p>
    </div>
  );
}
