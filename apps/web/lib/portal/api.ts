import { createApiClient, ApiError } from '@autoroom/api/client';

export { ApiError };
export type { ApiClient } from '@autoroom/api/client';

/**
 * Relative, same-origin — every call here goes to this site's own
 * `app/api/portal/**\/route.ts` proxy, never to the admin API's origin
 * directly. That used to be a genuinely cross-origin browser call
 * (`autoroom.am` → `admin.autoroom.am/api`, gated on `CORS_ORIGINS`), which
 * broke in production because that env var was never actually opened for
 * this site's origin on the server — see `lib/portal/proxy.ts`'s doc
 * comment for the full story and why a same-origin proxy, not a CORS fix,
 * is the reliable way to keep this working.
 */
const baseUrl = '/api';

/**
 * Builds a client bound to the current access token — same contract as
 * `apps/admin/src/lib/api.ts`'s `makeClient`, which this is deliberately kept
 * in lockstep with (down to the comment) rather than diverging for no reason.
 *
 * A new client per token rather than a mutable header bag: the token lives in
 * React state, and rebuilding the closure when it changes means a request can
 * never pick up a stale one mid-render.
 *
 * `credentials: 'include'` is what carries the `ar_refresh`/`ar_csrf`
 * cookies to this same-origin proxy — same-origin `fetch` would send them
 * by default anyway, but this makes the requirement explicit rather than
 * relying on a browser default this file doesn't otherwise state.
 */
export function makeClient(accessToken?: string | null) {
  return createApiClient({
    baseUrl,
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

/** Client for the calls made before a token exists: login, refresh. */
export const anonymousClient = makeClient();

/**
 * Wraps a token-bound client so a request that hits a 401 — the access token
 * expired between the scheduled rotation and this call — transparently
 * rotates and retries once, instead of surfacing the error to whatever screen
 * happened to be mid-request. Identical shape to admin's `withReauth`.
 */
export function withReauth<T extends object>(client: T, rotate: () => Promise<string | null>): T {
  function wrap<V extends object>(target: V, path: PropertyKey[]): V {
    return new Proxy(target, {
      get(obj, prop, receiver) {
        const value = Reflect.get(obj, prop, receiver);
        if (typeof value === 'function') {
          return async (...args: unknown[]) => {
            try {
              return await (value as (...a: unknown[]) => unknown).apply(obj, args);
            } catch (error) {
              if (!(error instanceof ApiError) || error.status !== 401) throw error;

              const freshToken = await rotate();
              if (!freshToken) throw error;

              let resolved: unknown = makeClient(freshToken);
              for (const key of path) resolved = (resolved as Record<PropertyKey, unknown>)[key];
              return await (resolved as (...a: unknown[]) => unknown)(...args);
            }
          };
        }
        if (value && typeof value === 'object') return wrap(value, [...path, prop]);
        return value;
      },
    });
  }

  return wrap(client, []);
}

/**
 * Turns an API failure into something worth showing a person.
 *
 * A 400 from `validateBody` carries a generic top-level `message` ("Request
 * validation failed") plus the actual reason in
 * `details.fields[].message` (e.g. "Password must be at least 6
 * characters") — same shape `apps/admin/src/lib/api.ts`'s
 * `extractFieldErrors` reads. The portal has no per-field error UI, so this
 * prefers those specific messages over the generic one rather than adding a
 * second helper only one caller would use.
 */
export function errorMessage(error: unknown, fallback = 'Ինչ-որ բան այնպես չգնաց։ Փորձեք կրկին։') {
  if (error instanceof ApiError) {
    const details = error.details as { fields?: { path: string; message: string }[] } | undefined;
    if (details?.fields?.length) return details.fields.map((field) => field.message).join(' ');
    return error.message;
  }
  if (error instanceof TypeError) {
    return 'Հնարավոր չէ կապվել սերվերի հետ։';
  }
  return fallback;
}
