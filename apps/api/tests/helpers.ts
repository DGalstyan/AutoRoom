import request from 'supertest';
import {
  BookingStatus,
  CarCondition,
  CarOrigin,
  Powertrain,
  UserStatus,
  type Prisma,
} from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/tokens';

/** One app instance for the suite — `createApp` binds no port. */
export const app = createApp();

export const agent = () => request(app);

/** bcrypt hash of a string no test uses. Never verified, only stored. */
const PLACEHOLDER_HASH = '$2a$12$K8yJqZ0oJqZ0oJqZ0oJqZuGqZ0oJqZ0oJqZ0oJqZ0oJqZ0oJqZ0oJq';

/**
 * Clears the rows tests create, leaving the seeded roles, permissions and
 * settings in place.
 *
 * Truncating the permission matrix between tests would mean re-seeding it
 * before every case, and the matrix is the thing under test — it should be
 * exactly what the seed produces, not something a helper rebuilt.
 */
export async function resetData() {
  // Listed explicitly rather than derived from the catalogue: an automatic
  // "truncate everything" would take the roles and permissions with it, and
  // those are the fixture the RBAC suite is asserting against.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE bookings, availability_slots, car_images, cars, partners, refresh_tokens, password_reset_tokens, audit_log, users RESTART IDENTITY CASCADE',
  );
}

export async function disconnect() {
  await prisma.$disconnect();
}

/**
 * A signed-in user of the given role.
 *
 * Mints the access token directly rather than posting to `/auth/login`: the
 * login route is not what these tests are about, and going through it would
 * spend the per-IP rate limit on setup.
 */
export async function createUser(
  roleKey: string,
  overrides: Partial<{ email: string; status: UserStatus }> = {},
) {
  const role = await prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) throw new Error(`Role "${roleKey}" is missing — did the seed run?`);

  const email =
    overrides.email ?? `${roleKey}.${Math.random().toString(36).slice(2, 10)}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      name: `Test ${roleKey}`,
      // A fixed bcrypt hash rather than a real one. Nothing in these suites
      // posts to /auth/login — tokens are minted directly — and hashing at cost
      // 12 for every fixture user added minutes to the run for no assertion.
      passwordHash: PLACEHOLDER_HASH,
      status: overrides.status ?? UserStatus.ACTIVE,
      roleId: role.id,
    },
  });

  return { user, token: signAccessToken({ sub: user.id, role: roleKey }) };
}

/** `Authorization` header for a token, or an empty object for anonymous calls. */
export const auth = (token?: string) => (token ? { Authorization: `Bearer ${token}` } : {});

export async function createPartner(
  overrides: Partial<{ name: string; active: boolean; userId: string | null }> = {},
) {
  return prisma.partner.create({
    data: {
      name: overrides.name ?? `Partner ${Math.random().toString(36).slice(2, 8)}`,
      active: overrides.active ?? true,
      userId: overrides.userId ?? null,
    },
  });
}

/** A partner with a portal login already attached. */
export async function createPartnerWithAccount(
  overrides: Partial<{ name: string; active: boolean }> = {},
) {
  const { user, token } = await createUser('partner');
  const partner = await createPartner({ ...overrides, userId: user.id });
  return { partner, user, token };
}

export async function createCar(overrides: Partial<Prisma.CarUncheckedCreateInput> = {}) {
  return prisma.car.create({
    data: {
      slug: overrides.slug ?? `car-${Math.random().toString(36).slice(2, 10)}`,
      origin: overrides.origin ?? CarOrigin.CHINA,
      make: overrides.make ?? 'Zeekr',
      model: overrides.model ?? '001',
      year: overrides.year ?? 2024,
      powertrain: overrides.powertrain ?? Powertrain.EV,
      price: overrides.price ?? 42_000,
      condition: overrides.condition ?? CarCondition.ON_ORDER,
      ...overrides,
    },
  });
}

export async function createBooking(
  partnerId: string,
  overrides: Partial<Prisma.BookingUncheckedCreateInput> = {},
) {
  return prisma.booking.create({
    data: {
      partnerId,
      scheduledAt: overrides.scheduledAt ?? new Date('2026-09-01T10:00:00.000Z'),
      status: overrides.status ?? BookingStatus.CONFIRMED,
      ...overrides,
    },
  });
}

/**
 * A bookable slot. Defaults sit in the future so the portal's "open slots"
 * route, which hides anything already past, can see it.
 */
export async function createSlot(
  overrides: Partial<Prisma.AvailabilitySlotUncheckedCreateInput> = {},
) {
  const startsAt = overrides.startsAt
    ? new Date(overrides.startsAt)
    : new Date('2027-03-01T10:00:00.000Z');
  return prisma.availabilitySlot.create({
    data: {
      startsAt,
      endsAt: overrides.endsAt ?? new Date(startsAt.getTime() + 30 * 60_000),
      capacity: overrides.capacity ?? 1,
      ...overrides,
    },
  });
}

/** A valid car body, so a 403 in a test is about permission and never validation. */
export function carBody(overrides: Record<string, unknown> = {}) {
  return {
    slug: `probe-${Math.random().toString(36).slice(2, 10)}`,
    origin: 'CHINA',
    make: 'Probe',
    model: 'X',
    year: 2024,
    powertrain: 'EV',
    price: 1000,
    condition: 'ON_ORDER',
    colors: [],
    priceJourney: [],
    ...overrides,
  };
}
