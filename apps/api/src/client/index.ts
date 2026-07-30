import type {
  AdminUser,
  ApiErrorBody,
  AuthContext,
  AvailabilityGenerateRequest,
  AvailabilityGenerateResponse,
  AvailabilityListQuery,
  AvailabilitySlot,
  AvailabilitySlotInput,
  Branch,
  BranchInput,
  Car,
  CarImage,
  CarInput,
  CarListQuery,
  CarListResponse,
  CreateUserRequest,
  ErrorCode,
  Faq,
  FaqInput,
  FaqTopic,
  HealthResponse,
  ImageAlbum,
  LoginRequest,
  LoginResponse,
  Media,
  MediaInput,
  MediaKind,
  Booking,
  BookingInput,
  Partner,
  PartnerAccountRequest,
  PartnerInput,
  PermissionCatalogue,
  PermissionPair,
  PortalCar,
  PortalIdentity,
  PublicSettings,
  RegisterRequest,
  RegisterResponse,
  RoleDetail,
  RoleSummary,
  Session,
  SettingKey,
  SettingRecord,
  SettingValues,
  UploadResponse,
  UpdateUserRequest,
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

/** `{ a: 1, b: undefined }` → `?a=1`. Undefined means "no filter", not "empty". */
function toSearch(query: object): string {
  const search = new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]): [string, string] => [key, String(value)]),
  ).toString();
  return search ? `?${search}` : '';
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

    cars: {
      list: (query: CarListQuery = {}, init?: RequestOptions) =>
        request<CarListResponse>('GET', `/cars${toSearch(query)}`, init),
      get: (id: string, init?: RequestOptions) => request<Car>('GET', `/cars/${id}`, init),
      create: (body: CarInput, init?: RequestOptions) =>
        request<Car>('POST', '/cars', { ...init, body }),
      update: (id: string, body: CarInput, init?: RequestOptions) =>
        request<Car>('PUT', `/cars/${id}`, { ...init, body }),
      remove: (id: string, init?: RequestOptions) => request<void>('DELETE', `/cars/${id}`, init),
      /** Separate from `update` because `cars:PUBLISH` is a separate permission. */
      setPublished: (id: string, published: boolean, init?: RequestOptions) =>
        request<Car>('POST', `/cars/${id}/publish`, { ...init, body: { published } }),

      /**
       * Assign, reassign, or detach (`null`) the car's partner without sending
       * the whole record back, which `update` would require.
       */
      setPartner: (id: string, partnerId: string | null, init?: RequestOptions) =>
        request<Car>('PATCH', `/cars/${id}/partner`, { ...init, body: { partnerId } }),

      addImage: (
        id: string,
        image: { album: ImageAlbum; url: string; position?: number },
        init?: RequestOptions,
      ) => request<CarImage>('POST', `/cars/${id}/images`, { ...init, body: image }),
      removeImage: (id: string, imageId: string, init?: RequestOptions) =>
        request<void>('DELETE', `/cars/${id}/images/${imageId}`, init),

      /** Unauthenticated, published rows only — what the website reads. */
      publicList: (query: CarListQuery = {}, init?: RequestOptions) =>
        request<CarListResponse>('GET', `/public/cars${toSearch(query)}`, init),
      publicGet: (slug: string, init?: RequestOptions) =>
        request<Car>('GET', `/public/cars/${slug}`, init),
    },

    /**
     * Posts a file and returns the URL to store. `FormData` sets its own
     * multipart boundary, so this bypasses `request` and its JSON headers.
     */
    upload: async (file: File, init?: RequestOptions): Promise<UploadResponse> => {
      const form = new FormData();
      form.append('file', file);

      const response = await doFetch(`${baseUrl}/uploads`, {
        method: 'POST',
        signal: init?.signal,
        credentials: options.credentials,
        headers: { Accept: 'application/json', ...options.headers, ...init?.headers },
        body: form,
      });

      const text = await response.text();
      const parsed: unknown = text ? JSON.parse(text) : null;
      if (!response.ok) {
        const body = parsed as ApiErrorBody | null;
        throw new ApiError(
          response.status,
          body?.error
            ? body
            : { error: { code: 'INTERNAL', message: `Upload failed with ${response.status}` } },
        );
      }
      return parsed as UploadResponse;
    },

    partners: {
      list: (
        query: { search?: string; take?: number; skip?: number } = {},
        init?: RequestOptions,
      ) =>
        request<{ items: Partner[]; total: number; take: number; skip: number }>(
          'GET',
          `/partners${toSearch(query)}`,
          init,
        ),
      create: (body: PartnerInput, init?: RequestOptions) =>
        request<Partner>('POST', '/partners', { ...init, body }),
      update: (id: string, body: PartnerInput, init?: RequestOptions) =>
        request<Partner>('PUT', `/partners/${id}`, { ...init, body }),
      remove: (id: string, init?: RequestOptions) =>
        request<void>('DELETE', `/partners/${id}`, init),
      /** Issues the portal login. Needs `users:CREATE` as well as `partners:UPDATE`. */
      createAccount: (id: string, body: PartnerAccountRequest, init?: RequestOptions) =>
        request<Partner>('POST', `/partners/${id}/account`, { ...init, body }),
    },

    bookings: {
      list: (
        query: { partnerId?: string; status?: string; take?: number; skip?: number } = {},
        init?: RequestOptions,
      ) =>
        request<{ items: Booking[]; total: number; take: number; skip: number }>(
          'GET',
          `/bookings${toSearch(query)}`,
          init,
        ),
      create: (body: BookingInput, init?: RequestOptions) =>
        request<Booking>('POST', '/bookings', { ...init, body }),
      update: (id: string, body: BookingInput, init?: RequestOptions) =>
        request<Booking>('PUT', `/bookings/${id}`, { ...init, body }),
      remove: (id: string, init?: RequestOptions) =>
        request<void>('DELETE', `/bookings/${id}`, init),
    },

    branches: {
      list: (init?: RequestOptions) =>
        request<{ items: Branch[]; total: number }>('GET', '/branches', init),
      create: (body: BranchInput, init?: RequestOptions) =>
        request<Branch>('POST', '/branches', { ...init, body }),
      update: (id: string, body: BranchInput, init?: RequestOptions) =>
        request<Branch>('PUT', `/branches/${id}`, { ...init, body }),
      remove: (id: string, init?: RequestOptions) =>
        request<void>('DELETE', `/branches/${id}`, init),
      /** Unauthenticated — the map, footer and Contact page read this. */
      public: (init?: RequestOptions) =>
        request<{ items: Branch[]; total: number }>('GET', '/public/branches', init),
    },

    /** Homepage S9 and the China/USA page sections. */
    faq: {
      list: (
        query: { topic?: FaqTopic; published?: boolean; take?: number; skip?: number } = {},
        init?: RequestOptions,
      ) =>
        request<{ items: Faq[]; total: number; take: number; skip: number }>(
          'GET',
          `/faq${toSearch(query)}`,
          init,
        ),
      create: (body: FaqInput, init?: RequestOptions) =>
        request<Faq>('POST', '/faq', { ...init, body }),
      update: (id: string, body: FaqInput, init?: RequestOptions) =>
        request<Faq>('PUT', `/faq/${id}`, { ...init, body }),
      remove: (id: string, init?: RequestOptions) => request<void>('DELETE', `/faq/${id}`, init),
      /** Separate from `update` because `faq:PUBLISH` is its own permission. */
      setPublished: (id: string, published: boolean, init?: RequestOptions) =>
        request<Faq>('POST', `/faq/${id}/publish`, { ...init, body: { published } }),
      /** Unauthenticated. No topic means the homepage's aggregated set. */
      public: (query: { topic?: FaqTopic } = {}, init?: RequestOptions) =>
        request<{ items: Faq[]; total: number }>('GET', `/public/faq${toSearch(query)}`, init),
    },

    /**
     * Homepage video: the Customer Story Wall, the founder film, guide reels.
     * The file goes through `upload`; what is stored here is the URL it returns.
     */
    media: {
      list: (
        query: { kind?: MediaKind; published?: boolean; take?: number; skip?: number } = {},
        init?: RequestOptions,
      ) =>
        request<{ items: Media[]; total: number; take: number; skip: number }>(
          'GET',
          `/media${toSearch(query)}`,
          init,
        ),
      create: (body: MediaInput, init?: RequestOptions) =>
        request<Media>('POST', '/media', { ...init, body }),
      update: (id: string, body: MediaInput, init?: RequestOptions) =>
        request<Media>('PUT', `/media/${id}`, { ...init, body }),
      remove: (id: string, init?: RequestOptions) => request<void>('DELETE', `/media/${id}`, init),
      /** Unauthenticated, published rows only — what the website reads. */
      public: (query: { kind?: MediaKind } = {}, init?: RequestOptions) =>
        request<{ items: Media[]; total: number }>('GET', `/public/media${toSearch(query)}`, init),
    },

    availability: {
      list: (query: AvailabilityListQuery = {}, init?: RequestOptions) =>
        request<{ items: AvailabilitySlot[]; total: number; take: number; skip: number }>(
          'GET',
          `/availability${toSearch(query)}`,
          init,
        ),
      create: (body: AvailabilitySlotInput, init?: RequestOptions) =>
        request<AvailabilitySlot>('POST', '/availability', { ...init, body }),
      update: (id: string, body: AvailabilitySlotInput, init?: RequestOptions) =>
        request<AvailabilitySlot>('PUT', `/availability/${id}`, { ...init, body }),
      /** 409s while bookings still hold the slot — cancel or move them first. */
      remove: (id: string, init?: RequestOptions) =>
        request<void>('DELETE', `/availability/${id}`, init),
      /** Fills a date range. Start times that already have a slot are skipped. */
      generate: (body: AvailabilityGenerateRequest, init?: RequestOptions) =>
        request<AvailabilityGenerateResponse>('POST', '/availability/generate', { ...init, body }),
    },

    /**
     * The partner's own view. Every call is scoped to the signed-in account's
     * partner by the server — none of these take a partner id, so there is
     * nothing a client could change to see someone else's rows.
     */
    portal: {
      me: (init?: RequestOptions) => request<PortalIdentity>('GET', '/portal/me', init),
      cars: (init?: RequestOptions) =>
        request<{ items: PortalCar[]; total: number }>('GET', '/portal/cars', init),
      bookings: (init?: RequestOptions) =>
        request<{ items: Booking[]; total: number }>('GET', '/portal/bookings', init),
      /** Open, future slots only — what this partner may actually book into. */
      availability: (init?: RequestOptions) =>
        request<{ items: AvailabilitySlot[]; total: number }>('GET', '/portal/availability', init),
    },

    settings: {
      /** Every setting, including private ones. Needs `settings:READ`. */
      list: (init?: RequestOptions) => request<SettingRecord[]>('GET', '/settings', init),

      /**
       * Replaces one setting's value wholesale. A 400 carries
       * `details.fields[]` naming the paths that failed validation.
       */
      update: <K extends SettingKey>(key: K, value: SettingValues[K], init?: RequestOptions) =>
        request<{ key: K; value: SettingValues[K] }>('PUT', `/settings/${key}`, {
          ...init,
          body: value,
        }),

      /** Unauthenticated — what the public website reads. */
      public: (init?: RequestOptions) => request<PublicSettings>('GET', '/settings/public', init),
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
      create: (body: CreateUserRequest, init?: RequestOptions) =>
        request<AdminUser>('POST', '/users', { ...init, body }),
      update: (id: string, body: UpdateUserRequest, init?: RequestOptions) =>
        request<AdminUser>('PATCH', `/users/${id}`, { ...init, body }),
      approve: (id: string, roleKey: string, init?: RequestOptions) =>
        request<AdminUser>('POST', `/users/${id}/approve`, { ...init, body: { roleKey } }),
      assignRole: (id: string, roleKey: string, init?: RequestOptions) =>
        request<AdminUser>('PATCH', `/users/${id}/role`, { ...init, body: { roleKey } }),
      setStatus: (id: string, status: UserStatus, init?: RequestOptions) =>
        request<AdminUser>('PATCH', `/users/${id}/status`, { ...init, body: { status } }),
      /** Revokes every session the user has; they must sign in again. */
      setPassword: (id: string, password: string, init?: RequestOptions) =>
        request<void>('POST', `/users/${id}/password`, { ...init, body: { password } }),
      remove: (id: string, init?: RequestOptions) => request<void>('DELETE', `/users/${id}`, init),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
