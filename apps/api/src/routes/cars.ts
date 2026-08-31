import { Router } from 'express';
import {
  CarCondition,
  CarOrigin,
  CarStatusBadge,
  ImageAlbum,
  Powertrain,
  Prisma,
} from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';

/**
 * Cars — `references/admin.md` B1.
 *
 * Publishing is a separate permission from editing (`cars:PUBLISH` vs
 * `cars:UPDATE`) and therefore a separate endpoint. A content editor writing a
 * listing and someone deciding it is ready to face the public are different
 * decisions, and collapsing them into one `PATCH` with a `publishedAt` field
 * would make the narrower permission unenforceable.
 */
export const carsRouter = Router();

/* --------------------------------- schemas --------------------------------- */

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens');

const colourSchema = z.object({
  name: z.string().trim().min(1).max(60),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour'),
  imageUrl: z
    .union([z.string().url(), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional(),
});

const priceChipSchema = z.object({
  label: z.string().trim().min(1).max(60),
  amount: z.number().int(),
  note: z
    .union([z.string().max(120), z.literal(''), z.null()])
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional(),
});

/**
 * The price journey is exactly four chips when present — the public component
 * lays out four and nothing else, so five would silently drop one and three
 * would leave a hole.
 */
const priceJourneySchema = z
  .array(priceChipSchema)
  .max(4)
  .refine((chips) => chips.length === 0 || chips.length === 4, {
    message: 'The price journey needs exactly four chips, or none at all',
  });

const carBodySchema = z.object({
  slug: slugSchema,
  origin: z.nativeEnum(CarOrigin),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  year: z.number().int().min(1950).max(2100),
  trim: z.string().trim().max(80).nullish(),

  powertrain: z.nativeEnum(Powertrain),
  range: z.number().int().min(0).max(3000).nullish(),
  battery: z.string().trim().max(60).nullish(),
  engine: z.string().trim().max(80).nullish(),
  drivetrain: z.string().trim().max(60).nullish(),
  transmission: z.string().trim().max(60).nullish(),
  seats: z.number().int().min(1).max(12).nullish(),
  warranty: z.string().trim().max(120).nullish(),

  vin: z.string().trim().max(32).nullish(),
  lotNumber: z.string().trim().max(40).nullish(),
  mileage: z.number().int().min(0).nullish(),

  price: z.number().int().min(0),
  oldPrice: z.number().int().min(0).nullish(),
  estFinalPriceAM: z.number().int().min(0).nullish(),

  condition: z.nativeEnum(CarCondition),
  statusBadge: z.nativeEnum(CarStatusBadge).nullish(),
  deliveryEtaDays: z.number().int().min(0).max(365).nullish(),
  location: z.string().trim().max(120).nullish(),
  damageHistory: z.string().trim().max(2000).nullish(),
  financingAvailable: z.boolean().default(true),
  featured: z.boolean().default(false),

  /// Null detaches the car from whichever partner held it.
  partnerId: z.string().min(1).nullish(),

  colors: z.array(colourSchema).max(20).default([]),
  priceJourney: priceJourneySchema.default([]),

  /// Admin-curated "Նմանատիպ առաջարկներ" pick list, in display order. The
  /// public car-detail page falls back to an automatic match when this is
  /// empty — see `CarSimilar` in schema.prisma.
  similarCarIds: z.array(z.string().min(1)).max(8).default([]),
});

/**
 * Colours describe "which one would you like ordered", so they only mean
 * anything on a car that has not been bought yet. Attaching them to an in-stock
 * car would offer the buyer a choice that does not exist.
 */
function assertColoursAllowed(condition: CarCondition, colours: unknown[]) {
  if (colours.length > 0 && condition !== CarCondition.ON_ORDER) {
    throw badRequest('Colour options apply only to cars with condition ON_ORDER', {
      fields: [{ path: 'colors', message: 'Only ON_ORDER cars can offer colour choices' }],
    });
  }
}

/**
 * Every id must be a real, distinct car, and (on update, where the row
 * already exists) not the car itself — "similar to itself" isn't a
 * meaningful pick and would also violate `CarSimilar`'s `@@id`.
 */
async function assertSimilarCarIdsValid(similarCarIds: string[], selfId?: string) {
  if (similarCarIds.length === 0) return;

  if (selfId && similarCarIds.includes(selfId)) {
    throw badRequest('A car cannot be listed as similar to itself', {
      fields: [{ path: 'similarCarIds', message: 'Remove the car itself from its own list' }],
    });
  }
  if (new Set(similarCarIds).size !== similarCarIds.length) {
    throw badRequest('Duplicate car in similarCarIds', {
      fields: [{ path: 'similarCarIds', message: 'Each car may appear at most once' }],
    });
  }

  const found = await prisma.car.count({ where: { id: { in: similarCarIds } } });
  if (found !== similarCarIds.length) {
    throw badRequest('One or more cars in similarCarIds do not exist', {
      fields: [{ path: 'similarCarIds', message: 'One or more selected cars were not found' }],
    });
  }
}

/** Replaces a car's curated similar-cars list wholesale — small (≤8), so delete-and-recreate is simpler than diffing. */
function writeSimilarCars(tx: Prisma.TransactionClient, carId: string, similarCarIds: string[]) {
  return Promise.all([
    tx.carSimilar.deleteMany({ where: { carId } }),
    similarCarIds.length > 0
      ? tx.carSimilar.createMany({
          data: similarCarIds.map((similarCarId, index) => ({
            carId,
            similarCarId,
            position: index,
          })),
        })
      : Promise.resolve(),
  ]);
}

const listQuerySchema = z.object({
  origin: z.nativeEnum(CarOrigin).optional(),
  condition: z.nativeEnum(CarCondition).optional(),
  /**
   * Narrow to one partner's cars. `none` is a deliberate escape hatch for the
   * opposite question — "what is sitting unassigned" — which an id-only filter
   * could not ask, since an empty value already means "no filter".
   */
  partnerId: z.string().min(1).optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  published: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: z.string().trim().max(120).optional(),
  /**
   * Exact-match facets for the China/USA listing filters (`Մակնիշ`/`Մոդել`) —
   * deliberately separate from `search`, which is a fuzzy OR-match across
   * several columns and unsuitable for a dropdown driven by known values.
   */
  make: z.string().trim().min(1).max(60).optional(),
  model: z.string().trim().min(1).max(60).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['createdAt', 'price', 'year', 'make']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  take: z.coerce.number().int().min(1).max(100).default(25),
  skip: z.coerce.number().int().min(0).default(0),
});

/**
 * `make`/`model`/price-range facets, shared verbatim by the admin `/cars`
 * list and the public China/USA listing — pulled out so the two routes
 * cannot drift on how a filter is applied.
 */
function facetWhere(
  query: Pick<z.infer<typeof listQuerySchema>, 'make' | 'model' | 'priceMin' | 'priceMax'>,
): Prisma.CarWhereInput {
  return {
    ...(query.make ? { make: { equals: query.make, mode: 'insensitive' } } : {}),
    ...(query.model ? { model: { equals: query.model, mode: 'insensitive' } } : {}),
    ...(query.priceMin !== undefined || query.priceMax !== undefined
      ? {
          price: {
            ...(query.priceMin !== undefined ? { gte: query.priceMin } : {}),
            ...(query.priceMax !== undefined ? { lte: query.priceMax } : {}),
          },
        }
      : {}),
  };
}

const imageSchema = z.object({
  album: z.nativeEnum(ImageAlbum),
  url: z.string().url().max(2048),
  position: z.number().int().min(0).max(999).optional(),
});

/* ---------------------------------- routes ---------------------------------- */

carsRouter.get(
  '/cars',
  requireAuth,
  requirePermission('cars', 'READ'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;

    const where: Prisma.CarWhereInput = {
      ...(query.origin ? { origin: query.origin } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
      ...(query.partnerId
        ? { partnerId: query.partnerId === 'none' ? null : query.partnerId }
        : {}),
      ...(query.featured === undefined ? {} : { featured: query.featured }),
      ...(query.published === undefined
        ? {}
        : query.published
          ? { publishedAt: { not: null } }
          : { publishedAt: null }),
      ...(query.search
        ? {
            OR: [
              { make: { contains: query.search, mode: 'insensitive' } },
              { model: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              { vin: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...facetWhere(query),
    };

    const [items, total] = await Promise.all([
      prisma.car.findMany({
        where,
        include: ADMIN_CAR_INCLUDE,
        orderBy: { [query.sort]: query.direction },
        take: query.take,
        skip: query.skip,
      }),
      prisma.car.count({ where }),
    ]);

    res.json({ items: items.map(serializeCar), total, take: query.take, skip: query.skip });
  },
);

carsRouter.get('/cars/:id', requireAuth, requirePermission('cars', 'READ'), async (req, res) => {
  const car = await prisma.car.findUnique({
    where: { id: String(req.params.id ?? '') },
    include: ADMIN_CAR_INCLUDE,
  });
  if (!car) throw notFound('Car not found');
  res.json(serializeCar(car));
});

carsRouter.post(
  '/cars',
  requireAuth,
  requirePermission('cars', 'CREATE'),
  validateBody(carBodySchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof carBodySchema>;
    assertColoursAllowed(body.condition, body.colors);
    await assertSimilarCarIdsValid(body.similarCarIds);

    if (await prisma.car.findUnique({ where: { slug: body.slug } })) {
      throw conflict(`A car with the slug "${body.slug}" already exists`);
    }

    const car = await prisma.$transaction(async (tx) => {
      const created = await tx.car.create({ data: toWriteData(body) });
      await writeSimilarCars(tx, created.id, body.similarCarIds);
      return tx.car.findUniqueOrThrow({ where: { id: created.id }, include: ADMIN_CAR_INCLUDE });
    });

    await audit(req.auth?.userId, 'car.create', car.id, { slug: car.slug });
    res.status(201).json(serializeCar(car));
  },
);

carsRouter.put(
  '/cars/:id',
  requireAuth,
  requirePermission('cars', 'UPDATE'),
  validateBody(carBodySchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const body = req.body as z.infer<typeof carBodySchema>;
    assertColoursAllowed(body.condition, body.colors);
    await assertSimilarCarIdsValid(body.similarCarIds, id);

    const existing = await prisma.car.findUnique({ where: { id } });
    if (!existing) throw notFound('Car not found');

    if (body.slug !== existing.slug) {
      const taken = await prisma.car.findUnique({ where: { slug: body.slug } });
      if (taken) throw conflict(`A car with the slug "${body.slug}" already exists`);
    }

    const car = await prisma.$transaction(async (tx) => {
      await tx.car.update({ where: { id }, data: toWriteData(body) });
      await writeSimilarCars(tx, id, body.similarCarIds);
      return tx.car.findUniqueOrThrow({ where: { id }, include: ADMIN_CAR_INCLUDE });
    });

    await audit(req.auth?.userId, 'car.update', car.id, { slug: car.slug });
    res.json(serializeCar(car));
  },
);

/**
 * Publishing is its own permission, so it is its own endpoint rather than a
 * field on the update body — otherwise `cars:PUBLISH` could not be withheld
 * from someone who holds `cars:UPDATE`.
 */
carsRouter.post(
  '/cars/:id/publish',
  requireAuth,
  requirePermission('cars', 'PUBLISH'),
  validateBody(z.object({ published: z.boolean() })),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const { published } = req.body as { published: boolean };

    const existing = await prisma.car.findUnique({ where: { id }, include: { images: true } });
    if (!existing) throw notFound('Car not found');

    // A listing with no photograph is not ready to be seen, whatever else is
    // filled in.
    if (published && existing.images.length === 0) {
      throw badRequest('Add at least one image before publishing');
    }

    const car = await prisma.car.update({
      where: { id },
      data: { publishedAt: published ? (existing.publishedAt ?? new Date()) : null },
      include: ADMIN_CAR_INCLUDE,
    });

    await audit(req.auth?.userId, published ? 'car.publish' : 'car.unpublish', car.id, {
      slug: car.slug,
    });
    res.json(serializeCar(car));
  },
);

carsRouter.delete(
  '/cars/:id',
  requireAuth,
  requirePermission('cars', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) throw notFound('Car not found');

    // Images cascade with the row.
    await prisma.car.delete({ where: { id } });
    await audit(req.auth?.userId, 'car.delete', id, { slug: car.slug });
    res.status(204).end();
  },
);

/* --------------------------------- assignment -------------------------------- */

/**
 * Assign, reassign, or detach a car's partner.
 *
 * Its own endpoint rather than a trip through `PUT /cars/:id`, which replaces
 * the whole record: reassigning from a list row would otherwise mean fetching
 * every field just to send them all back unchanged, and any field the list did
 * not know about would be dropped on the way through.
 *
 * `null` detaches. A car holds at most one partner, but a partner holds any
 * number of cars — that is the direction the relation runs, so reassigning is
 * simply pointing this car somewhere else, never anything the losing partner
 * has to be updated for.
 */
carsRouter.patch(
  '/cars/:id/partner',
  requireAuth,
  requirePermission('cars', 'UPDATE'),
  validateBody(z.object({ partnerId: z.string().min(1).nullable() })),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const { partnerId } = req.body as { partnerId: string | null };

    if (!(await prisma.car.findUnique({ where: { id } }))) throw notFound('Car not found');
    if (partnerId && !(await prisma.partner.findUnique({ where: { id: partnerId } }))) {
      throw badRequest('Unknown partner');
    }

    const car = await prisma.car.update({
      where: { id },
      data: { partnerId },
      include: ADMIN_CAR_INCLUDE,
    });

    await audit(req.auth?.userId, partnerId ? 'car.assign' : 'car.unassign', id, {
      slug: car.slug,
      partnerId,
    });
    res.json(serializeCar(car));
  },
);

/* ---------------------------------- images ---------------------------------- */

carsRouter.post(
  '/cars/:id/images',
  requireAuth,
  requirePermission('cars', 'UPDATE'),
  validateBody(imageSchema),
  async (req, res) => {
    const carId = String(req.params.id ?? '');
    const body = req.body as z.infer<typeof imageSchema>;

    if (!(await prisma.car.findUnique({ where: { id: carId } }))) throw notFound('Car not found');

    const last = await prisma.carImage.findFirst({
      where: { carId, album: body.album },
      orderBy: { position: 'desc' },
    });

    const image = await prisma.carImage.create({
      data: {
        carId,
        album: body.album,
        url: body.url,
        position: body.position ?? (last ? last.position + 1 : 0),
      },
    });

    res.status(201).json(serializeImage(image));
  },
);

carsRouter.delete(
  '/cars/:id/images/:imageId',
  requireAuth,
  requirePermission('cars', 'UPDATE'),
  async (req, res) => {
    const carId = String(req.params.id ?? '');
    const imageId = String(req.params.imageId ?? '');

    const image = await prisma.carImage.findUnique({ where: { id: imageId } });
    if (!image || image.carId !== carId) throw notFound('Image not found');

    await prisma.carImage.delete({ where: { id: imageId } });
    res.status(204).end();
  },
);

/* ------------------------------- public reads ------------------------------- */

/**
 * Unauthenticated, published rows only. Separate handler rather than a flag on
 * the guarded list: a filter that must always be applied is safer as its own
 * route than as a condition someone can forget.
 */
carsRouter.get('/public/cars', validateQuery(listQuerySchema), async (req, res) => {
  const query = req.query as unknown as z.infer<typeof listQuerySchema>;

  const where: Prisma.CarWhereInput = {
    publishedAt: { not: null },
    ...(query.origin ? { origin: query.origin } : {}),
    ...(query.condition ? { condition: query.condition } : {}),
    ...(query.featured === undefined ? {} : { featured: query.featured }),
    ...facetWhere(query),
  };

  const [items, total] = await Promise.all([
    prisma.car.findMany({
      where,
      include: { images: { orderBy: [{ album: 'asc' }, { position: 'asc' }] } },
      orderBy: { [query.sort]: query.direction },
      take: query.take,
      skip: query.skip,
    }),
    prisma.car.count({ where }),
  ]);

  res.set('Cache-Control', 'public, max-age=60');
  res.json({ items: items.map(serializeCar), total, take: query.take, skip: query.skip });
});

carsRouter.get('/public/cars/:slug', async (req, res) => {
  const car = await prisma.car.findFirst({
    where: { slug: String(req.params.slug ?? ''), publishedAt: { not: null } },
    include: PUBLIC_CAR_INCLUDE,
  });
  if (!car) throw notFound('Car not found');

  res.set('Cache-Control', 'public, max-age=60');
  res.json(serializeCar(car));
});

/* --------------------------------- helpers --------------------------------- */

function toWriteData(body: z.infer<typeof carBodySchema>) {
  const { colors, priceJourney, similarCarIds: _similarCarIds, ...rest } = body;
  return {
    ...rest,
    colors: colors as unknown as Prisma.InputJsonValue,
    priceJourney: priceJourney as unknown as Prisma.InputJsonValue,
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: 'cars',
      resourceId,
      dataJson: data as never,
    },
  });
}

// Not `satisfies`-typed against a Prisma-generated arg type of its own — the
// generated name for "the shape of the `similarAsSource` include field" is
// an awkward internal type (`Car$similarAsSourceArgs`) to reference directly.
// `as const` on every literal keeps them narrow (not widened to `string`) so
// this still validates correctly once spread into `ADMIN_CAR_INCLUDE`/
// `PUBLIC_CAR_INCLUDE`'s own `satisfies Prisma.CarInclude`.
const SIMILAR_CARS_INCLUDE = {
  orderBy: { position: 'asc' as const },
  include: {
    similarCar: {
      include: { images: { orderBy: [{ album: 'asc' as const }, { position: 'asc' as const }] } },
    },
  },
};

/**
 * What the admin reads for one car (the edit form, and create/update
 * responses) — full detail including the curated similar-cars pick list, so
 * the form can show which cars are currently selected. The public routes
 * deliberately do not use `partner` — the site has no business knowing
 * which dealer holds a car, and the safest way to keep a field out of a
 * response is not to select it.
 */
/**
 * What the admin reads — both the list view and one car. Deliberately the
 * *same* include for both, even though the list view never renders a row's
 * own similar-cars sub-list: the admin UI's "quick toggle" actions (feature/
 * unfeature from the list) round-trip a fetched `Car` straight back through
 * `PUT /cars/:id` as its own update body (`toInput()` in `CarsPage.tsx`). If
 * the list route fetched a leaner shape that left `similarCars` empty, that
 * round-trip would silently blank out a car's real curated picks on every
 * unrelated quick-toggle — a genuine data-loss bug, not just wasted payload.
 * A few extra nested rows on an admin-only, ≤100-row list is the cheaper
 * mistake to make.
 */
const ADMIN_CAR_INCLUDE = {
  images: { orderBy: [{ album: 'asc' }, { position: 'asc' }] },
  partner: { select: { id: true, name: true, company: true } },
  similarAsSource: SIMILAR_CARS_INCLUDE,
} satisfies Prisma.CarInclude;

/**
 * The public car-detail route's include — no `partner`, and a curated
 * similar car that has since been unpublished quietly drops out rather than
 * leaking a draft row. The public *list* route keeps its own leaner include
 * (below `/public/cars`) — unlike the admin side, nothing on the public list
 * ever round-trips a fetched row back through a write, so there's no
 * equivalent data-loss risk to the admin one explained above.
 */
const PUBLIC_CAR_INCLUDE = {
  images: { orderBy: [{ album: 'asc' }, { position: 'asc' }] },
  similarAsSource: {
    ...SIMILAR_CARS_INCLUDE,
    where: { similarCar: { publishedAt: { not: null } } },
  },
} satisfies Prisma.CarInclude;

/**
 * `partner` is optional because the public rows genuinely lack it, and
 * `similarAsSource` is optional because list endpoints deliberately don't
 * fetch it (a grid of up to 100 cars each carrying its own full nested
 * similar-cars sub-list would be pure waste — nothing renders it there).
 * Absent and empty mean different things for `partner`: absent is "this
 * response does not carry partner information", null is "no partner is
 * assigned". For `similarAsSource`, absent and empty both simply serialize
 * to `similarCars: []`, since nothing distinguishes "not fetched" from
 * "fetched, curated list is empty" for a caller that didn't ask either way.
 */
type SimilarCarRow = Prisma.CarSimilarGetPayload<{
  include: { similarCar: { include: { images: true } } };
}>;

type CarRow = Prisma.CarGetPayload<{ include: { images: true } }> & {
  partner?: { id: string; name: string; company: string | null } | null;
  similarAsSource?: SimilarCarRow[];
};

/** Everything about a car except its own `similarCars` — what a similar-cars pick is serialized as, to avoid recursing into *its* similar cars. */
function serializeCarBase(car: Omit<CarRow, 'similarAsSource'>) {
  return {
    ...car,
    colors: car.colors ?? [],
    priceJourney: car.priceJourney ?? [],
    publishedAt: car.publishedAt?.toISOString() ?? null,
    createdAt: car.createdAt.toISOString(),
    updatedAt: car.updatedAt.toISOString(),
    images: car.images.map(serializeImage),
  };
}

function serializeCar(car: CarRow) {
  return {
    ...serializeCarBase(car),
    similarCars: (car.similarAsSource ?? []).map((row) => serializeCarBase(row.similarCar)),
  };
}

function serializeImage(image: {
  id: string;
  carId: string;
  album: ImageAlbum;
  url: string;
  position: number;
}) {
  return {
    id: image.id,
    carId: image.carId,
    album: image.album,
    url: image.url,
    position: image.position,
  };
}
