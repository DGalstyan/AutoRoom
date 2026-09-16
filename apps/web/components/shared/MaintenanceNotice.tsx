/** The full-page notice `RootLayout` swaps in for every route while
 * `features.toggles.maintenanceMode` is on — see its own comment. Server
 * component: the two strings are resolved server-side, same as every other
 * `RootLayout` value, so this needs no `LocaleProvider`. */
export function MaintenanceNotice({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center text-white">
      <h1 className="font-display text-h2 font-bold">{heading}</h1>
      <p className="max-w-md text-body text-muted">{body}</p>
    </div>
  );
}
