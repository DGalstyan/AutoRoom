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
 * 10, not a complexity rule: length is worth more entropy than forcing a
 * digit or a symbol, and the panel is reachable from the public internet.
 */
export const MIN_PASSWORD_LENGTH = 10;

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
  /** True on a system-issued password — the client gates the panel behind `/auth/change-password`. */
  mustChangePassword: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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

  /** The partner this car is assigned to, if any. */
  partnerId: string | null;
  /**
   * The assigned partner, on admin responses only — the public routes do not
   * select it. Absent means "this response carries no partner information";
   * null means "no partner is assigned".
   */
  partner?: { id: string; name: string; company: string | null } | null;

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
  /** A partner's id, or the literal `'none'` for cars assigned to nobody. */
  partnerId?: string;
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

/* --------------------------------- partners --------------------------------- */

export type BookingStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Partner {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
  /** The portal login, once one has been issued. */
  account: { id: string; email: string; status: UserStatus } | null;
  carCount: number;
  bookingCount: number;
  createdAt: string;
}

export type PartnerInput = Pick<
  Partner,
  'name' | 'company' | 'phone' | 'email' | 'notes' | 'active'
>;

export interface PartnerAccountRequest {
  email: string;
  name?: string;
}

/** The temporary password is present exactly once, in this response. */
export type PartnerAccountResponse = Partner & { temporaryPassword: string };

export interface Booking {
  id: string;
  partnerId: string;
  partner: { id: string; name: string };
  carId: string | null;
  car: { id: string; slug: string; make: string; model: string; year: number } | null;
  /** The diary slot this appointment holds, when it was booked from one. */
  slotId: string | null;
  slot: {
    id: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    branch: BranchRef | null;
  } | null;
  customerName: string | null;
  customerPhone: string | null;
  /** ISO 8601. Bound to the slot's `startsAt` whenever a slot is held. */
  scheduledAt: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
}

/**
 * Give a `slotId` or a `scheduledAt`, not neither. With a slot the server sets
 * the time from it, so anything sent in `scheduledAt` is ignored.
 */
export interface BookingInput {
  partnerId: string;
  carId?: string | null;
  slotId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  scheduledAt?: string;
  status: BookingStatus;
  notes?: string | null;
}

/* ------------------------------- availability ------------------------------- */

export interface BranchRef {
  id: string;
  name: string;
  city: string;
}

/** A branch — a pin on the homepage map and everything its popup shows. */
export interface Branch extends BranchRef {
  address: string;
  phone: string;
  hours: string;
  /** Places the pin. Null until someone fills it in. */
  lat: number | null;
  lng: number | null;
  /** Backs the `Ուղղություն` link out to Google Maps. */
  mapUrl: string | null;
  photoUrl: string | null;
  position: number;
}

export type BranchInput = Omit<Branch, 'id'>;

/* ------------------------------------ faq ----------------------------------- */

/**
 * `GENERAL` covers the answered set that belongs to neither country page — how
 * payment is staged, how the contract is signed, where the branches are.
 */
export type FaqTopic = 'CHINA' | 'USA' | 'GENERAL';

/**
 * A question or answer, keyed by locale. `hy` (Armenian) is the one language
 * every question must carry — it's the site's default and only
 * guaranteed-enabled locale (see `LocalizationLocales`); `ru`/`en` fill in as
 * translations are written.
 */
export type LocalizedText = Partial<Record<Locale, string>>;

export interface Faq {
  id: string;
  topic: FaqTopic;
  question: LocalizedText;
  /** Null while the Armenian answer is still to be written. Such a row cannot publish. */
  answer: LocalizedText | null;
  position: number;
  /** Null means draft — the public endpoint does not return it. */
  publishedAt: string | null;
  createdAt: string;
}

export interface FaqInput {
  topic: FaqTopic;
  question: LocalizedText;
  answer?: LocalizedText | null;
  position: number;
  published: boolean;
}

/* ----------------------------------- media ---------------------------------- */

export type MediaKind = 'FOUNDER' | 'CUSTOMER_STORY' | 'GUIDE_REEL';

/**
 * A video the site plays. `CUSTOMER_STORY` rows are the homepage Story Wall,
 * and only those carry the customer fields.
 */
export interface Media {
  id: string;
  kind: MediaKind;
  title: string;
  videoUrl: string;
  /** Still frame shown before play. Without one the wall is a grid of black. */
  posterUrl: string | null;

  customerName: string | null;
  /** Free text — the story outlives the listing it was about. */
  carLabel: string | null;
  origin: CarOrigin | null;
  whyChosen: string | null;
  experience: string | null;

  position: number;
  /** Null means draft — the public endpoint does not return it. */
  publishedAt: string | null;
  createdAt: string;
}

export interface MediaInput {
  kind: MediaKind;
  title: string;
  videoUrl: string;
  posterUrl?: string | null;
  customerName?: string | null;
  carLabel?: string | null;
  origin?: CarOrigin | null;
  whyChosen?: string | null;
  experience?: string | null;
  position: number;
  published: boolean;
}

/** A bookable window. `open` is derived from `bookedCount` against `capacity`. */
export interface AvailabilitySlot {
  id: string;
  branchId: string | null;
  branch: BranchRef | null;
  /** ISO 8601. */
  startsAt: string;
  endsAt: string;
  capacity: number;
  note: string | null;
  bookedCount: number;
  open: boolean;
  createdAt: string;
}

export interface AvailabilitySlotInput {
  branchId?: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  note?: string | null;
}

/** Bulk fill for a date range. Times are local wall-clock at `offsetMinutes`. */
export interface AvailabilityGenerateRequest {
  branchId?: string | null;
  /** `YYYY-MM-DD`, inclusive. */
  from: string;
  to: string;
  /** Sunday = 0. Empty means every day in the range. */
  weekdays?: number[];
  /** `HH:mm` local. */
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacity?: number;
  /** `-new Date().getTimezoneOffset()`; Yerevan is 240. Defaults to UTC. */
  offsetMinutes?: number;
}

export interface AvailabilityGenerateResponse {
  created: number;
  /** Start times that already had a slot at this branch, left untouched. */
  skipped: number;
  items: AvailabilitySlot[];
}

export interface AvailabilityListQuery {
  /** ISO 8601. Defaults to now → 30 days out. */
  from?: string;
  to?: string;
  branchId?: string;
  onlyOpen?: boolean;
  take?: number;
  skip?: number;
}

/* ---------------------------------- portal ---------------------------------- */

/** What a signed-in partner sees about themselves. */
export interface PortalIdentity {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  counts: {
    cars: number;
    publishedCars: number;
    bookings: number;
    upcomingBookings: number;
  };
}

/**
 * The portal's narrower view of a car — internal fields such as damage history
 * and notes are absent from the response, not merely hidden by the UI.
 */
export interface PortalCar {
  id: string;
  slug: string;
  origin: CarOrigin;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  powertrain: Powertrain;
  price: number;
  estFinalPriceAM: number | null;
  condition: CarCondition;
  statusBadge: CarStatusBadge | null;
  deliveryEtaDays: number | null;
  location: string | null;
  mileage: number | null;
  vin: string | null;
  publishedAt: string | null;
  images: { id: string; album: ImageAlbum; url: string; position: number }[];
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
