import type { ApiErrorBody, ErrorCode, HealthResponse } from './types';

export * from './types';

/**
 * Typed API client. Both consumers import this instead of hand-rolling `fetch`
 * calls, so a changed route or response shape is a TypeScript error at the call
 * site rather than a runtime surprise.
 *
 *   import { createApiClient } from '@autoroom/api/client';
 *   const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL! });
 *   const health = await api.health();
 *
 * No dependencies beyond `fetch`, so it runs in a React Server Component, in the
 * browser and in the admin SPA unchanged.
 */

/** A non-2xx response, carrying the API's structured error body. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }
}

/**
 * Declared locally rather than pulled from the DOM lib: this module is compiled
 * for a Node server as well as the browser, and adding `dom` to `lib` would
 * conflict with Node's own fetch typings.
 */
export type CredentialsMode = 'omit' | 'same-origin' | 'include';

export interface ApiClientOptions {
  /** Origin of the API, e.g. `http://localhost:4000`. No trailing slash needed. */
  baseUrl: string;
  /** Swap in a custom fetch — Next.js request-scoped fetch, a test double, etc. */
  fetch?: typeof globalThis.fetch;
  /** Sent on every request; A1 uses this for the Authorization header. */
  headers?: Record<string, string>;
  /**
   * Send cookies cross-origin. Required once A1 issues the httpOnly refresh
   * cookie; harmless before that.
   */
  credentials?: CredentialsMode;
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const doFetch = options.fetch ?? globalThis.fetch;

  async function request<T>(
    method: string,
    path: string,
    init: RequestOptions & { body?: unknown } = {},
  ): Promise<T> {
    const response = await doFetch(`${baseUrl}${path}`, {
      method,
      signal: init.signal,
      credentials: options.credentials,
      headers: {
        Accept: 'application/json',
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
        ...init.headers,
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });

    // 204 and other empty bodies would blow up `.json()`.
    const text = await response.text();
    const parsed: unknown = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const body = parsed as ApiErrorBody | null;
      throw new ApiError(
        response.status,
        body?.error
          ? body
          : { error: { code: 'INTERNAL', message: `Request failed with ${response.status}` } },
      );
    }

    return parsed as T;
  }

  return {
    request,
    /** `GET /health` — also returns 503 with a `degraded` body if the DB is down. */
    health: (init?: RequestOptions) => request<HealthResponse>('GET', '/health', init),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
