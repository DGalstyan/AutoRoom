import { createApiClient, ApiError } from '@autoroom/api/client';

export { ApiError };
export type { ApiClient } from '@autoroom/api/client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Builds a client bound to the current access token — same contract as
 * `apps/admin/src/lib/api.ts`'s `makeClient`, which this is deliberately kept
 * in lockstep with (down to the comment) rather than diverging for no reason.
 *
 * A new client per token rather than a mutable header bag: the token lives in
 * React state, and rebuilding the closure when it changes means a request can
 * never pick up a stale one mid-render.
 *
 * `credentials: 'include'` is what carries the refresh and CSRF cookies. The
 * public site and the API are different origins in both dev
 * (`localhost:3000` / `localhost:4000`) and production
 * (`autoroom.am` / `admin.autoroom.am`) — but the same *site* (same
 * registrable domain) in both, so the SameSite=Lax cookies are still sent.
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

/** Turns an API failure into something worth showing a person. */
export function errorMessage(error: unknown, fallback = 'Ինչ-որ բան այնպես չգնաց։ Փորձեք կրկին։') {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) {
    return 'Հնարավոր չէ կապվել սերվերի հետ։';
  }
  return fallback;
}
