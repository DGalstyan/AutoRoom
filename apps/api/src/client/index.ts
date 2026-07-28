import type {
  AdminUser,
  ApiErrorBody,
  AuthContext,
  ErrorCode,
  HealthResponse,
  LoginRequest,
  LoginResponse,
  PermissionCatalogue,
  PermissionPair,
  RegisterRequest,
  RegisterResponse,
  RoleDetail,
  RoleSummary,
  Session,
  UserListResponse,
  UserStatus,
} from './types';

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

  /**
   * Cookie-authenticated calls (`/auth/refresh`, `/auth/logout`) must echo the
   * readable `ar_csrf` cookie in a header. Reading it here keeps that detail out
   * of every call site.
   */
  function csrfHeader(): Record<string, string> {
    // Reached through `globalThis` rather than the DOM lib: this module is also
    // compiled for the server, where `document` does not exist.
    const doc = (globalThis as { document?: { cookie?: string } }).document;
    const match = doc?.cookie?.match(/(?:^|;\s*)ar_csrf=([^;]+)/);
    return match?.[1] ? { 'x-csrf-token': decodeURIComponent(match[1]) } : {};
  }

  return {
    request,
    csrfHeader,

    /** `GET /health` — also returns 503 with a `degraded` body if the DB is down. */
    health: (init?: RequestOptions) => request<HealthResponse>('GET', '/health', init),

    auth: {
      register: (body: RegisterRequest, init?: RequestOptions) =>
        request<RegisterResponse>('POST', '/auth/register', { ...init, body }),

      login: (body: LoginRequest, init?: RequestOptions) =>
        request<LoginResponse>('POST', '/auth/login', { ...init, body }),

      /** Rotates the refresh cookie. Requires `credentials: 'include'`. */
      refresh: (init?: RequestOptions) =>
        request<Session>('POST', '/auth/refresh', {
          ...init,
          headers: { ...csrfHeader(), ...init?.headers },
        }),

      logout: (init?: RequestOptions) =>
        request<void>('POST', '/auth/logout', {
          ...init,
          headers: { ...csrfHeader(), ...init?.headers },
        }),

      forgot: (body: { email: string }, init?: RequestOptions) =>
        request<{ message: string }>('POST', '/auth/forgot', { ...init, body }),

      reset: (body: { token: string; password: string }, init?: RequestOptions) =>
        request<{ message: string }>('POST', '/auth/reset', { ...init, body }),

      me: (init?: RequestOptions) => request<AuthContext>('GET', '/auth/me', init),
    },

    roles: {
      list: (init?: RequestOptions) => request<RoleSummary[]>('GET', '/roles', init),
      get: (key: string, init?: RequestOptions) =>
        request<RoleDetail>('GET', `/roles/${key}`, init),
      catalogue: (init?: RequestOptions) =>
        request<PermissionCatalogue>('GET', '/permissions', init),
      /** Replaces the role's grants with exactly this set. */
      setPermissions: (key: string, permissions: PermissionPair[], init?: RequestOptions) =>
        request<{ key: string; permissions: PermissionPair[] }>(
          'PUT',
          `/roles/${key}/permissions`,
          { ...init, body: { permissions } },
        ),
    },

    users: {
      list: (
        query: { status?: UserStatus; take?: number; skip?: number } = {},
        init?: RequestOptions,
      ) => {
        const search = new URLSearchParams(
          Object.entries(query)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]): [string, string] => [key, String(value)]),
        ).toString();
        return request<UserListResponse>('GET', `/users${search ? `?${search}` : ''}`, init);
      },
      approve: (id: string, roleKey: string, init?: RequestOptions) =>
        request<AdminUser>('POST', `/users/${id}/approve`, { ...init, body: { roleKey } }),
      assignRole: (id: string, roleKey: string, init?: RequestOptions) =>
        request<AdminUser>('PATCH', `/users/${id}/role`, { ...init, body: { roleKey } }),
      setStatus: (id: string, status: UserStatus, init?: RequestOptions) =>
        request<AdminUser>('PATCH', `/users/${id}/status`, { ...init, body: { status } }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
