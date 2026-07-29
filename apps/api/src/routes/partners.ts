import { Router } from 'express';
import { BookingStatus, Prisma, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, notFound } from '../lib/errors';
import { MIN_PASSWORD_LENGTH, hashPassword } from '../lib/password';
import { requireAuth } from '../middleware/auth';
import { requirePartner } from '../middleware/partner';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import { revokeAllSessions } from '../services/session';

/**
 * Partners and bookings — `references/admin.md` C3 — plus the portal the
 * partner themselves signs into.
 *
 * Two audiences, two sets of routes. Staff use `/partners` and `/bookings`
 * behind the matrix and see everything. A partner uses `/portal/*`, which is
 * scoped to their own records by `requirePartner` rather than by a permission,
 * because "their own" is a property of the row, not of the resource.
 */
export const partnersRouter = Router();

/* --------------------------------- schemas --------------------------------- */

const partnerBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  company: z.string().trim().max(160).nullish(),
  phone: z.string().trim().max(40).nullish(),
  email: z
    .union([z.string().email(), z.literal(''), z.null()])
    .transform((v) => (v === '' ? null : v)),
  notes: z.string().trim().max(2000).nullish(),
  active: z.boolean().default(true),
});

const accountSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  name: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

const bookingBodySchema = z.object({
  partnerId: z.string().min(1),
  carId: z.string().min(1).nullish(),
  customerName: z.string().trim().max(120).nullish(),
  customerPhone: z.string().trim().max(40).nullish(),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  status: z.nativeEnum(BookingStatus).default(BookingStatus.REQUESTED),
  notes: z.string().trim().max(2000).nullish(),
});

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

const bookingQuerySchema = z.object({
  partnerId: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

/* ------------------------------ staff: partners ----------------------------- */

partnersRouter.get(
  '/partners',
  requireAuth,
  requirePermission('partners', 'READ'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const { search, take, skip } = req.query as unknown as z.infer<typeof listQuerySchema>;

    const where: Prisma.PartnerWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, status: true } },
          _count: { select: { cars: true, bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.partner.count({ where }),
    ]);

    res.json({ items: items.map(serializePartner), total, take, skip });
  },
);

partnersRouter.post(
  '/partners',
  requireAuth,
  requirePermission('partners', 'CREATE'),
  validateBody(partnerBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof partnerBodySchema>;
    const partner = await prisma.partner.create({
      data: body,
      include: {
        user: { select: { id: true, email: true, status: true } },
        _count: { select: { cars: true, bookings: true } },
      },
    });
    await audit(req.auth?.userId, 'partner.create', partner.id, { name: partner.name });
    res.status(201).json(serializePartner(partner));
  },
);

partnersRouter.put(
  '/partners/:id',
  requireAuth,
  requirePermission('partners', 'UPDATE'),
  validateBody(partnerBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.partner.findUnique({ where: { id } }))) throw notFound('Partner not found');

    const partner = await prisma.partner.update({
      where: { id },
      data: req.body as z.infer<typeof partnerBodySchema>,
      include: {
        user: { select: { id: true, email: true, status: true } },
        _count: { select: { cars: true, bookings: true } },
      },
    });

    // Deactivating is meant to take effect now, not when their token expires.
    if (!partner.active && partner.userId) await revokeAllSessions(partner.userId);

    await audit(req.auth?.userId, 'partner.update', partner.id, { active: partner.active });
    res.json(serializePartner(partner));
  },
);

partnersRouter.delete(
  '/partners/:id',
  requireAuth,
  requirePermission('partners', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) throw notFound('Partner not found');

    // Their cars survive with `partnerId` nulled (SetNull); bookings do not
    // outlive the partner they belong to (Cascade).
    await prisma.partner.delete({ where: { id } });
    if (partner.userId) await revokeAllSessions(partner.userId);

    await audit(req.auth?.userId, 'partner.delete', id, { name: partner.name });
    res.status(204).end();
  },
);

/**
 * Give a partner a portal login.
 *
 * Creates the user with the `partner` role and links it. Needs `users:CREATE`
 * as well as `partners:UPDATE` — it is an account being created, and the
 * permission that governs that should not be side-stepped by coming at it from
 * the partners screen.
 */
partnersRouter.post(
  '/partners/:id/account',
  requireAuth,
  requirePermission('partners', 'UPDATE'),
  requirePermission('users', 'CREATE'),
  validateBody(accountSchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const body = req.body as z.infer<typeof accountSchema>;

    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) throw notFound('Partner not found');
    if (partner.userId) throw badRequest('This partner already has a portal account');

    if (await prisma.user.findUnique({ where: { email: body.email } })) {
      throw conflict('An account with this email already exists');
    }

    const role = await prisma.role.findUnique({ where: { key: 'partner' } });
    if (!role) throw badRequest('The partner role is missing. Run the seed.');

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name ?? partner.name,
        passwordHash: await hashPassword(body.password),
        status: UserStatus.ACTIVE,
        roleId: role.id,
      },
    });

    const updated = await prisma.partner.update({
      where: { id },
      data: { userId: user.id },
      include: {
        user: { select: { id: true, email: true, status: true } },
        _count: { select: { cars: true, bookings: true } },
      },
    });

    await audit(req.auth?.userId, 'partner.account.create', id, { email: user.email });
    res.status(201).json(serializePartner(updated));
  },
);

/* ------------------------------ staff: bookings ----------------------------- */

partnersRouter.get(
  '/bookings',
  requireAuth,
  requirePermission('bookings', 'READ'),
  validateQuery(bookingQuerySchema),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof bookingQuerySchema>;
    const where: Prisma.BookingWhereInput = {
      ...(query.partnerId ? { partnerId: query.partnerId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { scheduledAt: 'desc' },
        take: query.take,
        skip: query.skip,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ items: items.map(serializeBooking), total, take: query.take, skip: query.skip });
  },
);

partnersRouter.post(
  '/bookings',
  requireAuth,
  requirePermission('bookings', 'CREATE'),
  validateBody(bookingBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof bookingBodySchema>;
    if (!(await prisma.partner.findUnique({ where: { id: body.partnerId } }))) {
      throw badRequest('Unknown partner');
    }

    const booking = await prisma.booking.create({
      data: { ...body, scheduledAt: new Date(body.scheduledAt) },
      include: BOOKING_INCLUDE,
    });
    await audit(req.auth?.userId, 'booking.create', booking.id, { partnerId: booking.partnerId });
    res.status(201).json(serializeBooking(booking));
  },
);

partnersRouter.put(
  '/bookings/:id',
  requireAuth,
  requirePermission('bookings', 'UPDATE'),
  validateBody(bookingBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.booking.findUnique({ where: { id } }))) throw notFound('Booking not found');
    const body = req.body as z.infer<typeof bookingBodySchema>;

    const booking = await prisma.booking.update({
      where: { id },
      data: { ...body, scheduledAt: new Date(body.scheduledAt) },
      include: BOOKING_INCLUDE,
    });
    await audit(req.auth?.userId, 'booking.update', id, { status: booking.status });
    res.json(serializeBooking(booking));
  },
);

partnersRouter.delete(
  '/bookings/:id',
  requireAuth,
  requirePermission('bookings', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!(await prisma.booking.findUnique({ where: { id } }))) throw notFound('Booking not found');
    await prisma.booking.delete({ where: { id } });
    await audit(req.auth?.userId, 'booking.delete', id, {});
    res.status(204).end();
  },
);

/* --------------------------------- portal ---------------------------------- */

/** Who the signed-in partner is, plus the counts their dashboard leads with. */
partnersRouter.get('/portal/me', requireAuth, requirePartner, async (req, res) => {
  const partner = await prisma.partner.findUnique({
    where: { id: req.partnerId! },
    include: { _count: { select: { cars: true, bookings: true } } },
  });
  if (!partner) throw notFound('Partner not found');

  const [upcoming, published] = await Promise.all([
    prisma.booking.count({
      where: {
        partnerId: partner.id,
        scheduledAt: { gte: new Date() },
        status: { in: [BookingStatus.REQUESTED, BookingStatus.CONFIRMED] },
      },
    }),
    prisma.car.count({ where: { partnerId: partner.id, publishedAt: { not: null } } }),
  ]);

  res.json({
    id: partner.id,
    name: partner.name,
    company: partner.company,
    phone: partner.phone,
    email: partner.email,
    counts: {
      cars: partner._count.cars,
      publishedCars: published,
      bookings: partner._count.bookings,
      upcomingBookings: upcoming,
    },
  });
});

/**
 * The cars assigned to this partner. Note there is no `partnerId` parameter —
 * the filter comes from the session, so there is nothing to tamper with.
 */
partnersRouter.get('/portal/cars', requireAuth, requirePartner, async (req, res) => {
  const cars = await prisma.car.findMany({
    where: { partnerId: req.partnerId! },
    include: { images: { orderBy: [{ album: 'asc' }, { position: 'asc' }] } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ items: cars.map(serializePortalCar), total: cars.length });
});

partnersRouter.get('/portal/bookings', requireAuth, requirePartner, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { partnerId: req.partnerId! },
    include: BOOKING_INCLUDE,
    orderBy: { scheduledAt: 'desc' },
  });

  res.json({ items: bookings.map(serializeBooking), total: bookings.length });
});

/* --------------------------------- helpers --------------------------------- */

const BOOKING_INCLUDE = {
  partner: { select: { id: true, name: true } },
  car: { select: { id: true, slug: true, make: true, model: true, year: true } },
} satisfies Prisma.BookingInclude;

type PartnerRow = Prisma.PartnerGetPayload<{
  include: {
    user: { select: { id: true; email: true; status: true } };
    _count: { select: { cars: true; bookings: true } };
  };
}>;

function serializePartner(partner: PartnerRow) {
  return {
    id: partner.id,
    name: partner.name,
    company: partner.company,
    phone: partner.phone,
    email: partner.email,
    notes: partner.notes,
    active: partner.active,
    account: partner.user
      ? { id: partner.user.id, email: partner.user.email, status: partner.user.status }
      : null,
    carCount: partner._count.cars,
    bookingCount: partner._count.bookings,
    createdAt: partner.createdAt.toISOString(),
  };
}

type BookingRow = Prisma.BookingGetPayload<{ include: typeof BOOKING_INCLUDE }>;

function serializeBooking(booking: BookingRow) {
  return {
    id: booking.id,
    partnerId: booking.partnerId,
    partner: booking.partner,
    carId: booking.carId,
    car: booking.car,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    scheduledAt: booking.scheduledAt.toISOString(),
    status: booking.status,
    notes: booking.notes,
    createdAt: booking.createdAt.toISOString(),
  };
}

type PortalCarRow = Prisma.CarGetPayload<{ include: { images: true } }>;

/**
 * The portal's view of a car. Narrower than the admin's on purpose: a partner
 * has no business seeing internal notes or the lot's damage history, and the
 * safest way to keep a field out of a response is not to put it in.
 */
function serializePortalCar(car: PortalCarRow) {
  return {
    id: car.id,
    slug: car.slug,
    origin: car.origin,
    make: car.make,
    model: car.model,
    year: car.year,
    trim: car.trim,
    powertrain: car.powertrain,
    price: car.price,
    estFinalPriceAM: car.estFinalPriceAM,
    condition: car.condition,
    statusBadge: car.statusBadge,
    deliveryEtaDays: car.deliveryEtaDays,
    location: car.location,
    mileage: car.mileage,
    vin: car.vin,
    publishedAt: car.publishedAt?.toISOString() ?? null,
    images: car.images.map((image) => ({
      id: image.id,
      album: image.album,
      url: image.url,
      position: image.position,
    })),
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: action.startsWith('booking') ? 'bookings' : 'partners',
      resourceId,
      dataJson: data as never,
    },
  });
}
