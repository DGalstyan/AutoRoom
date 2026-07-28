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

/** Turns an API failure into something worth showing a person. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Try again.') {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) {
    // fetch throws TypeError when it cannot reach the host at all.
    return 'Cannot reach the server. Check that the API is running.';
  }
  return fallback;
}
