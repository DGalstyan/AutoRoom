import { createApiClient, ApiError } from '@autoroom/api/client';

export { ApiError };
export type { ApiClient } from '@autoroom/api/client';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/**
 * Builds a client bound to the current access token.
 *
 * A new client per token rather than a mutable header bag: the token lives in
 * React state, and rebuilding the closure when it changes means a request can
 * never pick up a stale one mid-render.
 *
 * `credentials: 'include'` is what carries the refresh and CSRF cookies. The
 * admin and the API are different origins but the same site in both dev
 * (`localhost:3000` / `localhost:4000`) and production, so the SameSite=Lax
 * cookies are sent.
 */
export function makeClient(accessToken?: string | null) {
  return createApiClient({
    baseUrl,
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

/** Client for the calls made before a token exists: login, refresh, reset. */
export const anonymousClient = makeClient();

/**
 * Wraps a token-bound client so a request that hits a 401 — the access token
 * expired between the scheduled rotation and this call, e.g. after the laptop
 * slept through it — transparently rotates and retries once, instead of
 * surfacing the error to whatever screen happened to be mid-request.
 *
 * A deep proxy rather than per-method wiring: the client is a nested object of
 * async functions (`api.cars.list`, `api.auth.me`, ...), and re-listing every
 * one here would drift the moment a new resource is added.
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

              // Re-resolve the same method off a client built from the new
              // token — retried once, not wrapped again, so a second 401
              // (refresh itself came back stale) surfaces rather than loops.
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
export function errorMessage(error: unknown, fallback = 'Something went wrong. Try again.') {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) {
    // fetch throws TypeError when it cannot reach the host at all.
    return 'Cannot reach the server. Check that the API is running.';
  }
  return fallback;
}
