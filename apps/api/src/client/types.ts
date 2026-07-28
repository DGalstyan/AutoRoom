/**
 * Wire types shared between the API and its consumers (the Next.js site and the
 * admin SPA).
 *
 * These are hand-written rather than generated from Prisma on purpose: the
 * database row and the JSON response are allowed to diverge — `passwordHash`
 * must never appear here, and A3's public settings endpoint exposes a deliberate
 * subset. Endpoints added in A1+ append their request/response pairs here, and
 * the client below stays the only place that knows the URLs.
 */

/**
 * Shortest password the API will accept. Lives here so the admin's forms
 * validate against the same number the server enforces instead of a copy that
 * drifts — the two disagreeing shows up as a form that submits happily and
 * comes back 400.
 *
 * Set deliberately low during development. See `lib/password.ts` for what that
 * costs.
 */
export const MIN_PASSWORD_LENGTH = 3;

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'SERVICE_UNAVAILABLE';

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  /** ISO 8601. */
  timestamp: string;
  database: { status: 'up'; latencyMs: number } | { status: 'down' };
}

/* ---------------------------------- auth ---------------------------------- */

export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';
export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'PUBLISH';

export interface RoleRef {
  key: string;
  name: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  /** Null until an admin approves the account and assigns a role. */
  role: RoleRef | null;
}

export interface Session {
  accessToken: string;
  /** Seconds until the access token expires — schedule a refresh before this. */
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = Session & { user: PublicUser };

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * The first-ever registration becomes an active super_admin and is signed in
 * immediately (201). Everyone else is created pending and gets 202 with no
 * session — discriminate on `status`.
 */
export type RegisterResponse =
  ({ status: 'active'; user: PublicUser } & Session) | { status: 'pending'; message: string };

/** `GET /auth/me` — the identity every guarded screen renders from. */
export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: RoleRef;
  /** `resource:action`, e.g. `cars:UPDATE`. Hide UI the role cannot use. */
  permissions: string[];
}

/* ------------------------------ roles & users ------------------------------ */

export interface PermissionPair {
  resource: string;
  action: PermissionAction;
}

export interface RoleSummary extends RoleRef {
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
}

export interface RoleDetail extends RoleRef {
  description: string | null;
  isSystem: boolean;
  permissions: PermissionPair[];
}

export interface PermissionCatalogue {
  /** Every resource and the actions that are meaningful for it. */
  resources: Record<string, PermissionAction[]>;
  permissions: (PermissionPair & { id: string })[];
}

export interface AdminUser extends PublicUser {
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserListResponse {
  items: AdminUser[];
  total: number;
  take: number;
  skip: number;
}

/**
 * Accounts are created complete — active, with a role and a password the
 * administrator hands over directly. There is no invite email, so nothing in
 * this flow depends on SMTP.
 */
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  roleKey: string;
}

/** At least one field must be present. */
export interface UpdateUserRequest {
  email?: string;
  name?: string;
}
