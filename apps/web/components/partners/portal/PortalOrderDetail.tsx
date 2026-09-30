'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Order, OrderStageName } from '@autoroom/api/client';
import { useMessages } from '@/components/shared/LocaleProvider';
import { usePortalAuth } from '@/components/partners/portal/PortalAuthProvider';
import { errorMessage } from '@/lib/portal/api';
import { formatUsd } from '@/lib/types/car';

/** The four steps this page's stepper shows — Figma node `431:667`. Not all
 * five `OrderStageName` values: `DELIVERED` isn't a step here, it's past
 * the last one (the car has already reached the partner). */
const STEPS: OrderStageName[] = ['CREATED', 'LOADING', 'IN_TRANSIT', 'ARRIVED'];

/**
 * The partner-facing "Cars inner page" (Figma node `431:633`) — what a
 * dealer's dashboard row opens on click (`PortalDashboard`'s orders table).
 * Fetches via `GET /portal/orders/:id`, scoped server-side to this partner's
 * own orders (`requirePartner` + a `partnerId` match in the query itself),
 * so there is nothing here that could ever show someone else's shipment.
 *
 * Deliberately simplified from the Figma in one place: the "Sections" tab
 * switcher (Commodity information / Invoices / Documents / Photos) is
 * flattened into one continuous view — there's no separate Invoices/
 * Documents list to switch to, only the fields this order actually has.
 */
export function PortalOrderDetail({ id }: { id: string }) {
  const t = useMessages().partners.portal.orderDetail;
  const stageLabels = useMessages().partners.portal.dashboard.orderStage;
  const { api } = usePortalAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.portal
      .orderDetail(id)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((caught) => {
        if (!cancelled) setError(errorMessage(caught, t.notFound));
      });
    return () => {
      cancelled = true;
    };
  }, [api, id, t.notFound]);

  const goToDashboard = () => router.push('/partners/portal/dashboard');

  if (error) {
    return (
      <div className="mx-auto max-w-container px-4 py-20 text-center sm:px-6">
        <p className="text-body text-neutral-700">{error}</p>
        <button
          type="button"
          onClick={goToDashboard}
          className="mt-4 text-body font-medium text-accent underline"
        >
          {t.back}
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="size-8 animate-spin rounded-full border-2 border-neutral-500 border-t-ink"
          aria-hidden
        />
      </div>
    );
  }

  const effectiveStepIndex =
    order.stage === 'DELIVERED' ? STEPS.length : STEPS.indexOf(order.stage);

  return (
    <div className="bg-surface-light">
      <div className="mx-auto max-w-container px-4 py-10 sm:px-6">
        <button
          type="button"
          onClick={goToDashboard}
          className="mb-4 flex items-center gap-2 text-body text-neutral-700 transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span> {t.back}
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-[32px] font-light leading-[1.25] text-ink sm:text-home-h2">
            {t.orderNumberPrefix}
            {order.orderNumber}
          </h1>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-body text-ink">
            <p>
              {t.customerTitle} <span className="font-bold">{order.partner?.name ?? '—'}</span>
            </p>
            <p>
              {t.branch} <span className="font-bold">{order.deliveryBranch ?? '—'}</span>
            </p>
          </div>
        </div>

        <Stepper
          currentIndex={effectiveStepIndex}
          order={order}
          stageLabels={stageLabels}
          dateLabel={t.stepper.dateLabel}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            {!order.insured && (
              <div className="rounded-xl bg-error-light/40 px-6 py-5 sm:px-9">
                <p className="font-bold text-neutral-800">{t.insurance.notProtectedTitle}</p>
                <p className="mt-1 text-small text-neutral-700">{t.insurance.notProtectedBody}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card heading={t.saleOrigin.heading}>
                <Field label={t.saleOrigin.saleOrigin} value={order.saleOrigin} />
                <Field
                  label={t.saleOrigin.purchaseDate}
                  value={formatDateOnly(order.purchaseDate)}
                />
                <Field label={t.saleOrigin.paidDate} value={formatDateOnly(order.paidDate)} />
                <Field label={t.saleOrigin.seller} value={order.seller} />
              </Card>

              <Card
                heading={t.shipping.heading}
                badge={
                  <Badge tone="neutral">
                    {t.shipping.consolidate} {order.consolidate ? t.shipping.yes : t.shipping.no}
                  </Badge>
                }
              >
                <Field label={t.shipping.finalDestination} value={order.finalDestination} />
                <Field label={t.shipping.shippingLine} value={order.shippingLine} />
                <Field label={t.shipping.vesselName} value={order.shipName} />
                <Field label={t.shipping.containerNumber} value={order.containerNumber} />
                {order.trackingUrl && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
                    <p className="shrink-0 text-body text-neutral-700">{t.shipping.trackingUrl}</p>
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-body font-medium text-info underline"
                    >
                      {order.trackingUrl}
                    </a>
                  </div>
                )}
              </Card>

              <Card
                heading={t.delivery.heading}
                badge={
                  order.truckingRequired ? (
                    <Badge tone="neutral">{t.delivery.truckingRequired}</Badge>
                  ) : undefined
                }
              >
                <Field label={t.delivery.deliveryTo} value={order.deliveryBranch} />
              </Card>

              <Card heading={t.exporterReceiver.heading}>
                <Field label={t.exporterReceiver.exporter} value={order.exporter} />
                <Field label={t.exporterReceiver.consignee} value={order.consignee} />
                <Field label={t.exporterReceiver.receivingAgent} value={order.receivingAgent} />
                <p className="rounded-xl bg-warn-light/30 p-3 text-small text-neutral-800">
                  {t.exporterReceiver.warning}
                </p>
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <ActionsCard order={order} t={t.actions} />
            <PhotosCard order={order} t={t.photos} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card heading={t.commodity.heading} className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-6">
              <Field label={t.commodity.vin} value={order.car.vin} />
              <Field
                label={t.commodity.vehicle}
                value={`${order.car.make} ${order.car.model} ${order.car.year}`}
              />
              <Field label={t.commodity.cargoType} value={order.oceanCargoType} />
              <Field label={t.commodity.buyerCode} value={order.buyerCode} />
              <Field label={t.commodity.lotNumber} value={order.car.lotNumber} />
              <Field label={t.commodity.gatePassId} value={order.gatePassId} />
              <Field label={t.commodity.vehicleValue} value={formatUsd(order.car.price)} />
            </div>
          </Card>

          <Card heading={t.inspection.heading}>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
              <p className="text-body text-neutral-700">{t.inspection.status}</p>
              <Badge tone={order.inspectionStatus === 'CONFIRMED' ? 'success' : 'neutral'}>
                {order.inspectionStatus === 'CONFIRMED'
                  ? t.inspection.confirmed
                  : t.inspection.pending}
              </Badge>
            </div>
            <Field
              label={t.inspection.keys}
              value={order.hasKeys ? t.inspection.yes : t.inspection.no}
            />
            <Field label={t.inspection.color} value={order.color} />
            <Field
              label={t.inspection.electric}
              value={order.electric ? t.inspection.yes : t.inspection.no}
            />
          </Card>

          <Card heading={t.documents.heading}>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
              <p className="text-body text-neutral-700">{t.documents.title}</p>
              <Badge tone={order.hasTitleDocument ? 'success' : 'neutral'}>
                {order.hasTitleDocument ? t.documents.yes : t.documents.no}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
              <p className="text-body text-neutral-700">{t.documents.billOfSale}</p>
              <Badge tone={order.hasBillOfSaleDocument ? 'success' : 'neutral'}>
                {order.hasBillOfSaleDocument ? t.documents.yes : t.documents.no}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stepper({
  currentIndex,
  order,
  stageLabels,
  dateLabel,
}: {
  currentIndex: number;
  order: Order;
  stageLabels: Record<OrderStageName, string>;
  dateLabel: string;
}) {
  return (
    <div className="flex flex-col divide-y divide-line-light rounded-xl bg-white sm:flex-row sm:divide-x sm:divide-y-0">
      {STEPS.map((step, index) => {
        const entry = order.stages.find((s) => s.stage === step);
        const occurredAt = entry?.occurredAt ?? (step === 'CREATED' ? order.createdAt : null);
        const done = index < currentIndex;
        const current = index === currentIndex;

        return (
          <div key={step} className="flex flex-1 items-center gap-4 px-6 py-4">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full text-body font-medium ${
                done
                  ? 'bg-accent text-ink'
                  : current
                    ? 'border-2 border-accent text-accent'
                    : 'border-2 border-neutral-500 text-neutral-500'
              }`}
            >
              {done ? '✓' : String(index + 1).padStart(2, '0')}
            </div>
            <div>
              <p
                className={`text-body font-medium ${done || current ? 'text-ink' : 'text-neutral-500'}`}
              >
                {stageLabels[step]}
              </p>
              {occurredAt && (
                <p className="text-small text-neutral-600">
                  {dateLabel}{' '}
                  <span className="font-medium text-neutral-700">{formatDateOnly(occurredAt)}</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Card({
  heading,
  badge,
  children,
  className,
}: {
  heading: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-neutral-25 p-6 sm:p-8 ${className ?? ''}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-[20px] font-bold text-ink">{heading}</h2>
        {badge}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
      <p className="shrink-0 text-body text-neutral-700">{label}</p>
      <p className="text-right text-body font-medium text-neutral-800">{value || '—'}</p>
    </div>
  );
}

const BADGE_TONE_CLASSES: Record<'neutral' | 'success', string> = {
  neutral: 'bg-neutral-100 text-neutral-800',
  success: 'bg-success-light/40 text-success',
};

function Badge({ tone, children }: { tone: 'neutral' | 'success'; children: React.ReactNode }) {
  return (
    <span
      className={`shrink-0 rounded-full px-4 py-1.5 text-small font-medium ${BADGE_TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

function ActionsCard({
  order,
  t,
}: {
  order: Order;
  t: {
    heading: string;
    subtitle: string;
    actionsLabel: string;
    noActionsNeeded: string;
    blockers: string;
    warnings: string;
    updates: string;
    noBlockersHeading: string;
    noBlockersBody: string;
    reasons: Record<string, string>;
  };
}) {
  const noActions = order.blockers.length === 0 && order.warnings.length === 0;
  const reason = (code: string) => t.reasons[code] ?? code;

  return (
    <div className="rounded-xl bg-white p-6 sm:p-8">
      <h2 className="mb-1 font-display text-[20px] font-bold text-ink">{t.heading}</h2>
      <p className="mb-3 text-small text-neutral-700">{t.subtitle}</p>
      <p className="mb-2 text-small font-bold text-neutral-700">{t.actionsLabel}</p>
      {noActions ? (
        <div className="rounded-xl bg-success-light/40 px-3 py-2.5">
          <p className="text-body text-success">{t.noActionsNeeded}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {order.blockers.map((code) => (
            <li
              key={code}
              className="rounded-xl bg-error-light/40 px-3 py-2 text-small text-neutral-800"
            >
              {reason(code)}
            </li>
          ))}
          {order.warnings.map((code) => (
            <li
              key={code}
              className="rounded-xl bg-warn-light/40 px-3 py-2 text-small text-neutral-800"
            >
              {reason(code)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-3">
        <span className="flex-1 rounded-full bg-error px-3 py-1.5 text-center text-small font-medium text-error-light">
          {t.blockers} {order.blockers.length}
        </span>
        <span className="flex-1 rounded-full bg-warn-light px-3 py-1.5 text-center text-small font-medium text-warn">
          {t.warnings} {order.warnings.length}
        </span>
        <span className="flex-1 rounded-full bg-info-light px-3 py-1.5 text-center text-small font-medium text-info">
          {t.updates} 0
        </span>
      </div>

      <hr className="my-4 border-neutral-100" />

      <p className="font-bold text-neutral-700">
        {order.blockers.length === 0
          ? t.noBlockersHeading
          : `${t.blockers} (${order.blockers.length})`}
      </p>
      <p className="text-small text-neutral-700">
        {order.blockers.length === 0 ? t.noBlockersBody : order.blockers.map(reason).join(' · ')}
      </p>
    </div>
  );
}

function PhotosCard({
  order,
  t,
}: {
  order: Order;
  t: {
    heading: string;
    pickUp: string;
    received: string;
    photosCount: string;
    downloadAll: string;
  };
}) {
  const rows: Array<{ label: string; urls: string[] }> = [
    { label: t.pickUp, urls: order.photos.pickUp },
    { label: t.received, urls: order.photos.received },
    { label: order.deliveryBranch ?? '—', urls: order.photos.handover },
  ];
  const allUrls = rows.flatMap((row) => row.urls);

  return (
    <div className="rounded-xl bg-white p-6 sm:p-8">
      <h2 className="mb-4 font-display text-[20px] font-bold text-ink">{t.heading}</h2>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-neutral-25 p-3"
          >
            <p className="font-bold text-neutral-800">{row.label}</p>
            <p
              className={
                row.urls.length > 0 ? 'font-bold text-ink' : 'font-medium text-neutral-500'
              }
            >
              {t.photosCount.replace('{count}', String(row.urls.length))}
            </p>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={allUrls.length === 0}
        onClick={() => downloadAll(allUrls)}
        className="mt-4 w-full rounded-pill bg-accent px-6 py-3 text-center text-small font-medium text-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t.downloadAll}
      </button>
    </div>
  );
}

/** No zip endpoint exists — this opens each image as its own download,
 * spaced out so the browser doesn't treat a burst of `.click()` calls as a
 * popup flood and block the later ones. */
async function downloadAll(urls: string[]) {
  for (const url of urls) {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

function formatDateOnly(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('hy-AM', { dateStyle: 'medium' });
}
