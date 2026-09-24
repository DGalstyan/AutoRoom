import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server-side proxy for the partner portal's auth/session calls
 * (`app/api/auth/**\/route.ts`, `app/api/portal/**\/route.ts` — one route
 * file per admin API path this portal calls, same shape under `/api`).
 *
 * The browser talks only to this same-origin `/api/*` path, never to
 * the admin API's own origin directly. That used to be a genuinely
 * cross-origin browser call (`autoroom.am` → `admin.autoroom.am/api`),
 * which needs `CORS_ORIGINS` opened for this site's origin on a production
 * `.env` this codebase has no reliable way to change — exactly the reason
 * `lib/actions/leads.ts`'s Server Action exists instead of a browser-side
 * `fetch` for lead submission. This is the same fix, applied to the portal's
 * session calls: the actual request happens here, on the Next.js server,
 * over the trusted internal-network path (`API_INTERNAL_URL`) every other
 * server-side fetch on this site already uses.
 *
 * The API's `ar_refresh` (httpOnly) and `ar_csrf` (readable) cookies are
 * re-hosted under this site's own origin rather than relayed byte-for-byte:
 * their `Set-Cookie` may carry a `Domain` scoped to the API's own host
 * (`COOKIE_DOMAIN`), which a browser would reject outright on a response
 * served from a different origin. Re-issuing them here — value and expiry
 * only, our own `httpOnly`/`secure`/`sameSite`/`path` — sidesteps that
 * entirely and matches `apps/api/src/lib/cookies.ts`'s own policy.
 */

const REFRESH_COOKIE = 'ar_refresh';
const CSRF_COOKIE = 'ar_csrf';

function apiBase(): string {
  return process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
}

/** Pulls one cookie's value + `Expires` out of a `Set-Cookie` header list. */
function extractCookie(
  setCookieHeaders: string[],
  name: string,
): { value: string; expires?: Date } | null {
  const prefix = `${name}=`;
  for (const header of setCookieHeaders) {
    const [first, ...attrs] = header.split(';').map((part) => part.trim());
    if (!first?.startsWith(prefix)) continue;
    const expiresAttr = attrs.find((attr) => attr.toLowerCase().startsWith('expires='));
    return {
      value: first.slice(prefix.length),
      expires: expiresAttr ? new Date(expiresAttr.slice('expires='.length)) : undefined,
    };
  }
  return null;
}

function relayAuthCookies(response: NextResponse, setCookieHeaders: string[]) {
  for (const [name, httpOnly] of [
    [REFRESH_COOKIE, true],
    [CSRF_COOKIE, false],
  ] as const) {
    const found = extractCookie(setCookieHeaders, name);
    if (!found) continue;
    response.cookies.set(name, found.value, {
      httpOnly,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: found.expires,
    });
  }
}

/**
 * Proxies one request to `${apiPath}` on the admin API: forwards the
 * client's `Authorization`/`x-csrf-token` headers and its own
 * `ar_refresh`/`ar_csrf` cookies, then relays the JSON body, status, and
 * those same two cookies back — re-hosted under this origin, not the API's.
 */
export async function proxyPortalRequest(
  request: NextRequest,
  method: 'GET' | 'POST',
  apiPath: string,
): Promise<NextResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  const authorization = request.headers.get('authorization');
  if (authorization) headers.Authorization = authorization;

  const csrfToken = request.headers.get('x-csrf-token');
  if (csrfToken) headers['x-csrf-token'] = csrfToken;

  const cookiePairs = [REFRESH_COOKIE, CSRF_COOKIE]
    .map((name) => [name, request.cookies.get(name)?.value] as const)
    .filter((pair): pair is [string, string] => pair[1] !== undefined);
  if (cookiePairs.length > 0) {
    headers.Cookie = cookiePairs.map(([name, value]) => `${name}=${value}`).join('; ');
  }

  let body: string | undefined;
  if (method === 'POST') {
    const text = await request.text();
    if (text) {
      body = text;
      headers['Content-Type'] = 'application/json';
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase()}${apiPath}`, { method, headers, body });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Հնարավոր չէ կապվել սերվերի հետ։' } },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  const response = new NextResponse(text || null, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });

  relayAuthCookies(response, upstream.headers.getSetCookie());
  return response;
}
