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

/* --------------------------------- catalogue -------------------------------- */

export type CarOrigin = 'CHINA' | 'USA';
export type CarCondition = 'IN_STOCK' | 'ON_ORDER' | 'ON_ROAD' | 'AUCTION';
export type CarStatusBadge = 'NA_NAVUM' | 'POTI' | 'CUSTOMS';
export type Powertrain = 'EV' | 'HYBRID' | 'BENZIN';

export type ImageAlbum =
  'EXTERIOR' | 'INTERIOR' | 'DETAILS' | 'VIDEO' | 'AUCTION' | 'RECEIPT' | 'HANDOVER';

export interface CarImage {
  id: string;
  carId: string;
  album: ImageAlbum;
  url: string;
  position: number;
}

/** Order-only: an in-stock car is one specific car in one specific colour. */
export interface CarColour {
  name: string;
  hex: string;
  imageUrl?: string | null;
}

/** One of the four chips breaking down how the price is reached. */
export interface PriceChip {
  label: string;
  amount: number;
  note?: string | null;
}

export interface Car {
  id: string;
  slug: string;
  origin: CarOrigin;
  make: string;
  model: string;
  year: number;
  trim: string | null;

  powertrain: Powertrain;
  range: number | null;
  battery: string | null;
  engine: string | null;
  drivetrain: string | null;
  transmission: string | null;
  seats: number | null;
  warranty: string | null;

  vin: string | null;
  lotNumber: string | null;
  mileage: number | null;

  /** Whole currency units — the site never renders cents. */
  price: number;
  oldPrice: number | null;
  estFinalPriceAM: number | null;

  condition: CarCondition;
  statusBadge: CarStatusBadge | null;
  deliveryEtaDays: number | null;
  location: string | null;
  damageHistory: string | null;
  financingAvailable: boolean;
  featured: boolean;

  colors: CarColour[];
  /** Exactly four chips, or none. */
  priceJourney: PriceChip[];

  /** Null means draft — the public API does not return it. */
  publishedAt: string | null;
  images: CarImage[];
  createdAt: string;
  updatedAt: string;
}

/** The writable fields. Images and publish state have their own endpoints. */
export type CarInput = Omit<Car, 'id' | 'publishedAt' | 'images' | 'createdAt' | 'updatedAt'>;

export interface CarListQuery {
  origin?: CarOrigin;
  condition?: CarCondition;
  featured?: boolean;
  published?: boolean;
  search?: string;
  sort?: 'createdAt' | 'price' | 'year' | 'make';
  direction?: 'asc' | 'desc';
  take?: number;
  skip?: number;
}

export interface CarListResponse {
  items: Car[];
  total: number;
  take: number;
  skip: number;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/* --------------------------------- settings --------------------------------- */

export type SettingGroup = 'BRANDING' | 'CONTACTS' | 'FINANCE' | 'FEATURES' | 'LOCALIZATION';

export type Locale = 'hy' | 'ru' | 'en';

export interface BrandingIdentity {
  brandName: string;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
}

/** Every value is a 6-digit hex colour. These override the compiled theme. */
export interface BrandingTheme {
  accent: string;
  accentHover: string;
  bg: string;
  surface: string;
  surfaceLight: string;
  paper: string;
  ink: string;
  muted: string;
  lineDark: string;
  lineLight: string;
  success: string;
  warn: string;
  info: string;
}

export interface BrandingTypography {
  display: string;
  body: string;
  /** Sora and Inter carry no Armenian glyphs; this is the fallback that does. */
  armenian: string;
}

export interface ContactsGeneral {
  phones: string[];
  email: string | null;
  workingHours: string | null;
}

export interface ContactsSocial {
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  linkedin: string | null;
}

export interface ContactsMessengers {
  whatsapp: string | null;
  viber: string | null;
  telegram: string | null;
}

export interface FeatureToggles {
  machinery: boolean;
  blog: boolean;
  quiz: boolean;
  registrationInviteOnly: boolean;
  maintenanceMode: boolean;
}

export interface LocalizationLocales {
  defaultLocale: Locale;
  enabledLocales: Locale[];
}

/** Maps each setting key to the shape stored under it. */
export interface SettingValues {
  'branding.identity': BrandingIdentity;
  'branding.theme': BrandingTheme;
  'branding.typography': BrandingTypography;
  'contacts.general': ContactsGeneral;
  'contacts.social': ContactsSocial;
  'contacts.messengers': ContactsMessengers;
  'finance.calculator': Record<string, unknown>;
  'features.toggles': FeatureToggles;
  'localization.locales': LocalizationLocales;
}

export type SettingKey = keyof SettingValues;

export interface SettingRecord<K extends SettingKey = SettingKey> {
  key: K;
  group: SettingGroup;
  /** Human label from the registry, so the UI need not hardcode one. */
  label: string;
  /** Whether `GET /settings/public` exposes this key. */
  isPublic: boolean;
  value: SettingValues[K];
  updatedAt: string | null;
  updatedBy: { id: string; name: string } | null;
}

/** `GET /settings/public` — the subset the website may read, unauthenticated. */
export type PublicSettings = Partial<SettingValues>;

/**
 * `400` bodies from a settings write carry per-field messages so a form can
 * mark the offending input.
 */
export interface SettingValidationDetails {
  fields: { path: string; message: string }[];
}
