import { Router } from 'express';
import { CarOrigin, DocumentKind, InspectionStatus, OrderStageName, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { requirePartner } from '../middleware/partner';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';

/**
 * Orders — `references/admin.md` C4. One row per shipment of one specific
 * car: container/ship/tracking data, a stage timeline (`OrderStage`, the
 * append-only history `Order.stage` is kept in sync with), documents
 * (invoices, customs paperwork — not photos, see `Order`'s schema comment),
 * and a payments ledger. Feeds the partner portal's "Ակտիվ մեքենաներ" stage
 * breakdown, "Վճարումների ամփոփում" payment summary, and the orders table.
 */
export const ordersRouter = Router();

/* --------------------------------- schemas --------------------------------- */

const urlOrNull = z
  .union([z.string().url().max(2048), z.literal(''), z.null()])
  .transform((value) => (value === '' ? null : value));

const orderCreateSchema = z.object({
  carId: z.string().min(1),
  orderNumber: z.string().trim().min(1).max(60),
  /** Defaults to the car's own assigned partner when omitted — explicit
   * `null` overrides that and leaves the order unassigned. */
  partnerId: z.string().min(1).nullish(),
  containerNumber: z.string().trim().max(80).nullish(),
  shipName: z.string().trim().max(120).nullish(),
  trackingUrl: urlOrNull.nullish(),
});

const nullableDateTimeString = z
  .union([z.string().datetime({ offset: true }), z.string().datetime()])
  .nullish();

/** Everything on the partner-facing "Cars inner page" (Figma node `431:633`)
 * beyond the original container/ship/tracking trio — sale origin, delivery,
 * exporter & receiver, shipping, commodity and inspection details. Not part
 * of `orderCreateSchema`: an order starts with just a car and a number, and
 * staff fill these in afterward from `OrderDetailPage`'s "Logistics &
 * customs" section. */
const logisticsSchema = z.object({
  color: z.string().trim().max(60).nullish(),
  saleOrigin: z.string().trim().max(200).nullish(),
  purchaseDate: nullableDateTimeString,
  paidDate: nullableDateTimeString,
  seller: z.string().trim().max(300).nullish(),
  deliveryBranch: z.string().trim().max(120).nullish(),
  truckingRequired: z.boolean().default(false),
  exporter: z.string().trim().max(200).nullish(),
  consignee: z.string().trim().max(200).nullish(),
  receivingAgent: z.string().trim().max(200).nullish(),
  consolidate: z.boolean().default(false),
  finalDestination: z.string().trim().max(120).nullish(),
  shippingLine: z.string().trim().max(120).nullish(),
  buyerCode: z.string().trim().max(80).nullish(),
  gatePassId: z.string().trim().max(80).nullish(),
  oceanCargoType: z.string().trim().max(120).nullish(),
  inspectionStatus: z.nativeEnum(InspectionStatus).default('PENDING'),
  hasKeys: z.boolean().default(false),
  insured: z.boolean().default(false),
});

const orderUpdateSchema = orderCreateSchema.omit({ carId: true }).merge(logisticsSchema);

const stageAdvanceSchema = z.object({
  stage: z.nativeEnum(OrderStageName),
  /** When this stage actually happened — staff can backdate or correct it,
   * not just log "now". */
  occurredAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  note: z.string().trim().max(500).nullish(),
});

const documentCreateSchema = z.object({
  kind: z.nativeEnum(DocumentKind).default('OTHER'),
  name: z.string().trim().min(1).max(160),
  url: z.string().url().max(2048),
});

const paymentCreateSchema = z.object({
  amount: z.number().int().positive().max(100_000_000),
  method: z.string().trim().max(80).nullish(),
  paidAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
});

const orderQuerySchema = z.object({
  partnerId: z.string().optional(),
  origin: z.nativeEnum(CarOrigin).optional(),
  stage: z.nativeEnum(OrderStageName).optional(),
  /** Matches order number, VIN, make or model. */
  search: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

/* ----------------------------------- staff ---------------------------------- */

ordersRouter.get(
  '/orders',
  requireAuth,
  requirePermission('orders', 'READ'),
  validateQuery(orderQuerySchema),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof orderQuerySchema>;

    const where: Prisma.OrderWhereInput = {
      ...(query.partnerId ? { partnerId: query.partnerId } : {}),
      ...(query.stage ? { stage: query.stage } : {}),
      ...(query.origin ? { car: { origin: query.origin } } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: 'insensitive' } },
              { car: { vin: { contains: query.search, mode: 'insensitive' } } },
              { car: { make: { contains: query.search, mode: 'insensitive' } } },
              { car: { model: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: query.take,
        skip: query.skip,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ items: items.map(serializeOrder), total, take: query.take, skip: query.skip });
  },
);

ordersRouter.post(
  '/orders',
  requireAuth,
  requirePermission('orders', 'CREATE'),
  validateBody(orderCreateSchema),
  async (req, res) => {
    const body = req.body as z.infer<typeof orderCreateSchema>;

    const car = await prisma.car.findUnique({ where: { id: body.carId } });
    if (!car) throw badRequest('Unknown car');

    const partnerId = body.partnerId !== undefined ? body.partnerId : car.partnerId;

    let order;
    try {
      order = await prisma.order.create({
        data: {
          carId: body.carId,
          orderNumber: body.orderNumber,
          partnerId,
          containerNumber: body.containerNumber ?? null,
          shipName: body.shipName ?? null,
          trackingUrl: body.trackingUrl ?? null,
        },
        include: ORDER_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[] | undefined) ?? [];
        if (target.includes('carId')) throw conflict('This car already has an order');
        throw conflict('That order number is already in use');
      }
      throw error;
    }

    await audit(req.auth?.userId, 'order.create', order.id, { orderNumber: order.orderNumber });
    res.status(201).json(serializeOrder(order));
  },
);

ordersRouter.get(
  '/orders/:id',
  requireAuth,
  requirePermission('orders', 'READ'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) throw notFound('Order not found');
    res.json(serializeOrder(order));
  },
);

ordersRouter.put(
  '/orders/:id',
  requireAuth,
  requirePermission('orders', 'UPDATE'),
  validateBody(orderUpdateSchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const body = req.body as z.infer<typeof orderUpdateSchema>;
    if (!(await prisma.order.findUnique({ where: { id } }))) throw notFound('Order not found');

    let order;
    try {
      order = await prisma.order.update({
        where: { id },
        data: {
          orderNumber: body.orderNumber,
          partnerId: body.partnerId ?? null,
          containerNumber: body.containerNumber ?? null,
          shipName: body.shipName ?? null,
          trackingUrl: body.trackingUrl ?? null,
          color: body.color ?? null,
          saleOrigin: body.saleOrigin ?? null,
          purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
          paidDate: body.paidDate ? new Date(body.paidDate) : null,
          seller: body.seller ?? null,
          deliveryBranch: body.deliveryBranch ?? null,
          truckingRequired: body.truckingRequired,
          exporter: body.exporter ?? null,
          consignee: body.consignee ?? null,
          receivingAgent: body.receivingAgent ?? null,
          consolidate: body.consolidate,
          finalDestination: body.finalDestination ?? null,
          shippingLine: body.shippingLine ?? null,
          buyerCode: body.buyerCode ?? null,
          gatePassId: body.gatePassId ?? null,
          oceanCargoType: body.oceanCargoType ?? null,
          inspectionStatus: body.inspectionStatus,
          hasKeys: body.hasKeys,
          insured: body.insured,
        },
        include: ORDER_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('That order number is already in use');
      }
      throw error;
    }

    await audit(req.auth?.userId, 'order.update', id, { orderNumber: order.orderNumber });
    res.json(serializeOrder(order));
  },
);

ordersRouter.delete(
  '/orders/:id',
  requireAuth,
  requirePermission('orders', 'DELETE'),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw notFound('Order not found');

    await prisma.order.delete({ where: { id } });
    await audit(req.auth?.userId, 'order.delete', id, { orderNumber: order.orderNumber });
    res.status(204).end();
  },
);

/**
 * Advances (or corrects) the order's current stage. Writes both: the
 * `OrderStage` timeline row this call adds, and `Order.stage`/`stageSetAt`,
 * which is what every count and list actually reads — see `Order`'s schema
 * comment on why the current stage is denormalized.
 */
ordersRouter.post(
  '/orders/:id/stages',
  requireAuth,
  requirePermission('orders', 'UPDATE'),
  validateBody(stageAdvanceSchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const body = req.body as z.infer<typeof stageAdvanceSchema>;
    if (!(await prisma.order.findUnique({ where: { id } }))) throw notFound('Order not found');

    const occurredAt = new Date(body.occurredAt);

    const order = await prisma.$transaction(async (tx) => {
      await tx.orderStage.create({
        data: { orderId: id, stage: body.stage, occurredAt, note: body.note ?? null },
      });
      return tx.order.update({
        where: { id },
        data: { stage: body.stage, stageSetAt: occurredAt },
        include: ORDER_INCLUDE,
      });
    });

    await audit(req.auth?.userId, 'order.stage.advance', id, { stage: body.stage });
    res.status(201).json(serializeOrder(order));
  },
);

ordersRouter.post(
  '/orders/:id/documents',
  requireAuth,
  requirePermission('documents', 'CREATE'),
  validateBody(documentCreateSchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const body = req.body as z.infer<typeof documentCreateSchema>;
    if (!(await prisma.order.findUnique({ where: { id } }))) throw notFound('Order not found');

    const document = await prisma.document.create({ data: { orderId: id, ...body } });
    await audit(req.auth?.userId, 'document.create', document.id, { name: document.name });
    res.status(201).json(serializeDocument(document));
  },
);

ordersRouter.delete(
  '/orders/:id/documents/:documentId',
  requireAuth,
  requirePermission('documents', 'DELETE'),
  async (req, res) => {
    const orderId = String(req.params.id ?? '');
    const documentId = String(req.params.documentId ?? '');
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.orderId !== orderId) throw notFound('Document not found');

    await prisma.document.delete({ where: { id: documentId } });
    await audit(req.auth?.userId, 'document.delete', documentId, { name: document.name });
    res.status(204).end();
  },
);

ordersRouter.post(
  '/orders/:id/payments',
  requireAuth,
  requirePermission('payments', 'CREATE'),
  validateBody(paymentCreateSchema),
  async (req, res) => {
    const id = String(req.params.id ?? '');
    const body = req.body as z.infer<typeof paymentCreateSchema>;
    if (!(await prisma.order.findUnique({ where: { id } }))) throw notFound('Order not found');

    const payment = await prisma.payment.create({
      data: {
        orderId: id,
        amount: body.amount,
        method: body.method ?? null,
        paidAt: new Date(body.paidAt),
      },
    });
    await audit(req.auth?.userId, 'payment.create', payment.id, { amount: payment.amount });
    res.status(201).json(serializePayment(payment));
  },
);

ordersRouter.delete(
  '/orders/:id/payments/:paymentId',
  requireAuth,
  requirePermission('payments', 'DELETE'),
  async (req, res) => {
    const orderId = String(req.params.id ?? '');
    const paymentId = String(req.params.paymentId ?? '');
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.orderId !== orderId) throw notFound('Payment not found');

    await prisma.payment.delete({ where: { id: paymentId } });
    await audit(req.auth?.userId, 'payment.delete', paymentId, { amount: payment.amount });
    res.status(204).end();
  },
);

/* --------------------------------- portal ---------------------------------- */

/** This partner's own orders — no `partnerId` parameter, same pattern as
 * `/portal/cars`/`/portal/bookings` in `partners.ts`. */
ordersRouter.get('/portal/orders', requireAuth, requirePartner, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { partnerId: req.partnerId! },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ items: orders.map(serializeOrder), total: orders.length });
});

/** One of this partner's own orders — the "Cars inner page" a click on a
 * dashboard row opens. Scoped by `partnerId` in the query itself (not a
 * fetch-then-check) so a partner can never even distinguish "not mine" from
 * "doesn't exist" for someone else's order. */
ordersRouter.get('/portal/orders/:id', requireAuth, requirePartner, async (req, res) => {
  const id = String(req.params.id ?? '');
  const order = await prisma.order.findFirst({
    where: { id, partnerId: req.partnerId! },
    include: ORDER_INCLUDE,
  });
  if (!order) throw notFound('Order not found');

  res.json(serializeOrder(order));
});

/* --------------------------------- helpers --------------------------------- */

const ORDER_INCLUDE = {
  car: {
    select: {
      id: true,
      slug: true,
      make: true,
      model: true,
      year: true,
      vin: true,
      lotNumber: true,
      origin: true,
      location: true,
      price: true,
      powertrain: true,
      images: { select: { album: true, url: true } },
    },
  },
  partner: { select: { id: true, name: true } },
  stages: { orderBy: { occurredAt: 'asc' } },
  documents: { orderBy: { createdAt: 'desc' } },
  payments: { orderBy: { paidAt: 'desc' } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

/** `amountPaid`/`amountDue`/`paymentStatus` are derived, not stored — the
 * ledger (`payments`) is the source of truth, and a stored total would drift
 * from it the first time a payment is added without remembering to update a
 * second column. */
export function serializeOrder(order: OrderRow) {
  const amountPaid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountDue = Math.max(0, order.car.price - amountPaid);
  const paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' =
    amountPaid <= 0 ? 'PENDING' : amountPaid >= order.car.price ? 'PAID' : 'PARTIAL';

  const { images, ...car } = order.car;
  const urlsForAlbum = (album: string) =>
    images.filter((image) => image.album === album).map((image) => image.url);
  const photos = {
    pickUp: urlsForAlbum('AUCTION'),
    received: urlsForAlbum('RECEIPT'),
    handover: urlsForAlbum('HANDOVER'),
  };

  const hasTitleDocument = order.documents.some((document) => document.kind === 'TITLE');
  const hasBillOfSaleDocument = order.documents.some(
    (document) => document.kind === 'BILL_OF_SALE',
  );

  /** Simple, honest rules — not a general workflow engine. A blocker is
   * something that actually stops the shipment; a warning is worth a
   * partner's attention but doesn't. Every count is computed from real data
   * the moment this is read, never stored, so it can't go stale.
   *
   * Codes, not prose: the partner portal is Armenian and the admin panel is
   * English, and this same array feeds both — a hardcoded English sentence
   * here would show up untranslated on the Armenian page. Each caller maps
   * the code to its own locale's copy. */
  const blockers: string[] = [];
  const warnings: string[] = [];
  const arrivedOrLater = order.stage === 'ARRIVED' || order.stage === 'DELIVERED';
  if (arrivedOrLater && !hasTitleDocument) blockers.push('MISSING_TITLE');
  if (order.truckingRequired && !order.deliveryBranch) {
    blockers.push('TRUCKING_NO_BRANCH');
  }
  if ((order.stage === 'IN_TRANSIT' || arrivedOrLater) && !order.trackingUrl) {
    warnings.push('NO_TRACKING_URL');
  }
  if (!order.insured) warnings.push('NOT_INSURED');

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    carId: order.carId,
    car,
    partnerId: order.partnerId,
    partner: order.partner,
    stage: order.stage,
    stageSetAt: order.stageSetAt.toISOString(),
    containerNumber: order.containerNumber,
    shipName: order.shipName,
    trackingUrl: order.trackingUrl,
    color: order.color,
    saleOrigin: order.saleOrigin,
    purchaseDate: order.purchaseDate?.toISOString() ?? null,
    paidDate: order.paidDate?.toISOString() ?? null,
    seller: order.seller,
    deliveryBranch: order.deliveryBranch,
    truckingRequired: order.truckingRequired,
    exporter: order.exporter,
    consignee: order.consignee,
    receivingAgent: order.receivingAgent,
    consolidate: order.consolidate,
    finalDestination: order.finalDestination,
    shippingLine: order.shippingLine,
    buyerCode: order.buyerCode,
    gatePassId: order.gatePassId,
    oceanCargoType: order.oceanCargoType,
    inspectionStatus: order.inspectionStatus,
    hasKeys: order.hasKeys,
    electric: car.powertrain === 'EV',
    insured: order.insured,
    hasTitleDocument,
    hasBillOfSaleDocument,
    photos,
    blockers,
    warnings,
    stages: order.stages.map((stage) => ({
      id: stage.id,
      stage: stage.stage,
      occurredAt: stage.occurredAt.toISOString(),
      note: stage.note,
      createdAt: stage.createdAt.toISOString(),
    })),
    documents: order.documents.map(serializeDocument),
    payments: order.payments.map(serializePayment),
    amountPaid,
    amountDue,
    paymentStatus,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function serializeDocument(document: {
  id: string;
  kind: DocumentKind;
  name: string;
  url: string;
  createdAt: Date;
}) {
  return {
    id: document.id,
    kind: document.kind,
    name: document.name,
    url: document.url,
    createdAt: document.createdAt.toISOString(),
  };
}

function serializePayment(payment: {
  id: string;
  amount: number;
  method: string | null;
  paidAt: Date;
  createdAt: Date;
}) {
  return {
    id: payment.id,
    amount: payment.amount,
    method: payment.method,
    paidAt: payment.paidAt.toISOString(),
    createdAt: payment.createdAt.toISOString(),
  };
}

function audit(actorId: string | undefined, action: string, resourceId: string, data: object) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      resource: action.startsWith('document')
        ? 'documents'
        : action.startsWith('payment')
          ? 'payments'
          : 'orders',
      resourceId,
      dataJson: data as never,
    },
  });
}
