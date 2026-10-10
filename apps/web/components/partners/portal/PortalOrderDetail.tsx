'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Order, OrderDocument, OrderStageName } from '@autoroom/api/client';
import { useMessages } from '@/components/shared/LocaleProvider';
import { usePortalAuth } from '@/components/partners/portal/PortalAuthProvider';
import { errorMessage } from '@/lib/portal/api';
import { formatUsd } from '@/lib/types/car';
import { interpolate } from '@/lib/messages';

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
 * The "Sections" bar is real now (Figma 441:6959): Commodity information, Invoices
 * (the order's INVOICE documents; flagged with a warning while there is none),
 * Documents (everything uploaded, grouped by how long ago) and Photos (pick-up,
 * received and handover groups, with a download-all).
 */
export function PortalOrderDetail({ id }: { id: string }) {
  const t = useMessages().partners.portal.orderDetail;
  const stageLabels = useMessages().partners.portal.dashboard.orderStage;
  const { api } = usePortalAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'commodity' | 'invoices' | 'documents' | 'photos'>('commodity');

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

  const invoices = order.documents.filter((document) => document.kind === 'INVOICE');
  const photoGroups = [
    { label: t.photos.pickUp, urls: order.photos.pickUp },
    { label: t.photos.received, urls: order.photos.received },
    { label: order.deliveryBranch ?? '—', urls: order.photos.handover },
  ];
  const photoCount = photoGroups.reduce((sum, group) => sum + group.urls.length, 0);

  return (
    <div className="bg-surface-light">
      <div className="mx-auto max-w-page px-4 pb-16 pt-32 sm:px-6 sm:pt-[185px] lg:px-12 lg:pb-[150px]">
        {/* Figma 441:6630: back chevron + 44px title on the left, who/where on the right. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToDashboard}
              aria-label={t.back}
              className="flex size-11 shrink-0 items-center justify-center rounded-pill text-ink transition-colors hover:bg-white sm:size-12"
            >
              <svg width="44" height="44" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M12.5 15 7.5 10l5-5"
                  stroke="currentColor"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="stretch-88 text-[26px] font-light leading-[34px] text-ink sm:text-home-h2 sm:leading-[58px]">
              {t.orderNumberPrefix}
              {order.orderNumber}
            </h1>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-1 text-[18px] leading-9 text-ink sm:text-[24px]">
            <p>
              {t.customerTitle} <span className="font-bold">{order.partner?.name ?? '—'}</span>
            </p>
            <p>
              {t.branch} <span className="font-bold">{order.deliveryBranch ?? '—'}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 lg:mt-16">
          <Stepper
            currentIndex={effectiveStepIndex}
            order={order}
            stageLabels={stageLabels}
            dateLabel={t.stepper.dateLabel}
          />
        </div>

        {/* Figma 441:6820 / 441:6710: a 913px column (alert + the four info cards) beside the 411px actions card. */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:mt-9 lg:grid-cols-[913fr_411fr] lg:items-start lg:gap-5">
          <div className="flex flex-col gap-6">
            {!order.insured && (
              <div className="rounded-[32px] bg-[rgba(255,209,209,0.4)] px-6 py-5 sm:px-9">
                <p className="text-[16px] font-bold leading-6 text-neutral-800">
                  {t.insurance.notProtectedTitle}
                </p>
                <p className="mt-1 text-[16px] leading-6 text-neutral-700">
                  {t.insurance.notProtectedBody}
                </p>
              </div>
            )}

            <div className="rounded-[32px] bg-white p-4 sm:p-6 lg:pt-9">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
                <div className="flex flex-col gap-4">
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
                    heading={t.delivery.heading}
                    badge={
                      order.truckingRequired ? (
                        <Badge tone="neutral">{t.delivery.truckingRequired}</Badge>
                      ) : undefined
                    }
                  >
                    <Field label={t.delivery.deliveryTo} value={order.deliveryBranch} />
                  </Card>
                </div>
                <div className="flex flex-col gap-4">
                  <Card
                    heading={t.shipping.heading}
                    badge={
                      <Badge tone="neutral">
                        {t.shipping.consolidate}{' '}
                        {order.consolidate ? t.shipping.yes : t.shipping.no}
                      </Badge>
                    }
                  >
                    <Field label={t.shipping.finalDestination} value={order.finalDestination} />
                    <Field label={t.shipping.shippingLine} value={order.shippingLine} />
                    <Field label={t.shipping.vesselName} value={order.shipName} />
                    <Field label={t.shipping.containerNumber} value={order.containerNumber} />
                    {order.trackingUrl && (
                      <div className="flex items-center justify-between gap-3 rounded-[12px] bg-white p-3">
                        <p className="shrink-0 text-[16px] leading-6 text-neutral-700">
                          {t.shipping.trackingUrl}
                        </p>
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 text-right text-[16px] font-medium leading-5 text-[#4b7bec] underline [overflow-wrap:anywhere]"
                        >
                          {order.trackingUrl}
                        </a>
                      </div>
                    )}
                  </Card>
                  <Card heading={t.exporterReceiver.heading}>
                    <Field label={t.exporterReceiver.exporter} value={order.exporter} />
                    <Field label={t.exporterReceiver.consignee} value={order.consignee} />
                    <Field label={t.exporterReceiver.receivingAgent} value={order.receivingAgent} />
                    <div className="flex items-center gap-1 rounded-[12px] bg-[rgba(255,240,179,0.3)] py-2.5 pl-2 pr-1.5">
                      <WarnGlyph />
                      <p className="min-w-0 flex-1 text-[14px] leading-[18px] text-neutral-800">
                        {t.exporterReceiver.warning}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          <ActionsCard order={order} t={t.actions} />
        </div>

        {/* Figma 441:6959: the sections bar, then the panel for the chosen tab. */}
        <div className="mt-9 flex flex-col gap-9">
          <div
            role="tablist"
            aria-label={t.tabs.aria}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[32px] bg-white px-4 py-3 lg:rounded-[70px]"
          >
            <TabPill active={tab === 'commodity'} onClick={() => setTab('commodity')}>
              {t.tabs.commodity}
            </TabPill>
            <TabPill active={tab === 'invoices'} onClick={() => setTab('invoices')}>
              {invoices.length === 0 && <WarnGlyph />}
              {t.tabs.invoices}
            </TabPill>
            <TabPill active={tab === 'documents'} onClick={() => setTab('documents')}>
              {t.tabs.documents}
            </TabPill>
            <TabPill active={tab === 'photos'} onClick={() => setTab('photos')}>
              {t.tabs.photos}({photoCount})
              {photoCount > 0 && (
                <span className="ml-0.5 size-1.5 rounded-full bg-error" aria-hidden="true" />
              )}
            </TabPill>
          </div>

          <div role="tabpanel" className="rounded-[32px] bg-white p-4 sm:p-6 lg:pt-9">
            {tab === 'commodity' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[862fr_419fr] lg:gap-6">
                <div className="flex flex-col gap-4">
                  <Card heading={t.commodity.heading}>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-x-6">
                      <div className="flex flex-col gap-2">
                        <Field label={t.commodity.vin} value={order.car.vin} />
                        <Field
                          label={t.commodity.vehicle}
                          value={`${order.car.make} ${order.car.model} ${order.car.year}`}
                        />
                        <Field label={t.commodity.cargoType} value={order.oceanCargoType} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Field label={`#${t.commodity.buyerCode}`} value={order.buyerCode} />
                        <Field label={`#${t.commodity.lotNumber}`} value={order.car.lotNumber} />
                        <Field label={`#${t.commodity.gatePassId}`} value={order.gatePassId} />
                        <Field
                          label={t.commodity.vehicleValue}
                          value={formatUsd(order.car.price)}
                        />
                      </div>
                    </div>
                  </Card>
                  <div className="lg:w-[calc(50%-12px)]">
                    <Card heading={t.documents.heading}>
                      <div className="flex items-center justify-between gap-3 rounded-[12px] bg-white p-3">
                        <p className="text-[16px] leading-6 text-neutral-700">
                          {t.documents.title}
                        </p>
                        <Badge tone={order.hasTitleDocument ? 'success' : 'neutral'}>
                          {order.hasTitleDocument ? t.documents.yes : t.documents.no}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-[12px] bg-white p-3">
                        <p className="text-[16px] leading-6 text-neutral-700">
                          {t.documents.billOfSale}
                        </p>
                        <Badge tone={order.hasBillOfSaleDocument ? 'success' : 'neutral'}>
                          {order.hasBillOfSaleDocument ? t.documents.yes : t.documents.no}
                        </Badge>
                      </div>
                    </Card>
                  </div>
                </div>

                <Card heading={t.inspection.heading}>
                  <div className="flex items-center justify-between gap-3 rounded-[12px] bg-white p-3">
                    <p className="text-[16px] leading-6 text-neutral-700">{t.inspection.status}</p>
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
              </div>
            )}

            {tab === 'invoices' && (
              <DocumentList
                documents={invoices}
                empty={t.invoicesTab.empty}
                kinds={t.documentsTab.kinds}
                openLabel={t.documentsTab.open}
              />
            )}

            {tab === 'documents' && (
              <DocumentsByAge documents={order.documents} t={t.documentsTab} />
            )}

            {tab === 'photos' && (
              <div className="rounded-[32px] bg-neutral-25 px-4 py-6 sm:px-9">
                {photoCount === 0 ? (
                  <p className="py-6 text-center text-[16px] text-neutral-700">
                    {t.photosTab.empty}
                  </p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {photoGroups
                      .filter((group) => group.urls.length > 0)
                      .map((group) => (
                        <section key={group.label} aria-label={group.label}>
                          <h2 className="text-[14px] font-bold leading-[18px] text-ink">
                            {group.label}({group.urls.length})
                          </h2>
                          <ul className="mt-4 flex flex-wrap gap-3">
                            {group.urls.map((url, index) => (
                              <li key={url}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative block size-[128px] overflow-hidden rounded-[24px] bg-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                >
                                  <Image
                                    src={url}
                                    alt={interpolate(t.photosTab.photo, { n: String(index + 1) })}
                                    fill
                                    sizes="128px"
                                    className="object-cover"
                                  />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    <button
                      type="button"
                      onClick={() => void downloadAll(photoGroups.flatMap((group) => group.urls))}
                      className="inline-flex h-12 w-fit items-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard hover:bg-accent-600"
                    >
                      {t.photos.downloadAll}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
    <ol className="grid grid-cols-1 rounded-[24px] bg-white sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => {
        const entry = order.stages.find((s) => s.stage === step);
        const occurredAt = entry?.occurredAt ?? (step === 'CREATED' ? order.createdAt : null);
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li
            key={step}
            aria-current={current ? 'step' : undefined}
            className="relative flex items-center gap-4 px-6 py-4"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-[20px] text-[16px] font-medium ${
                done
                  ? 'bg-[#3a9d75] text-white'
                  : current
                    ? 'border-2 border-[#cfffe0] text-[#3a9d75]'
                    : 'border-2 border-[#cfd6dc] text-[#abb7c2]'
              }`}
            >
              {done ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="m6 12.5 4 4 8-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                String(index + 1).padStart(2, '0')
              )}
            </span>
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[16px] font-medium leading-5 text-[#0d0b26]">
                {stageLabels[step]}
              </span>
              <span
                className={`text-[14px] leading-[18px] ${
                  done || current ? 'text-neutral-600' : 'text-neutral-500'
                }`}
              >
                {dateLabel} <span className="font-medium">{formatDateOnly(occurredAt) ?? '—'}</span>
              </span>
            </span>
            {index < STEPS.length - 1 && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="absolute right-0 top-1/2 hidden -translate-y-1/2 text-neutral-600 lg:block"
              >
                <path
                  d="m10 7 5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** An info card — Figma `Frame 1597886075`: #FAFAFA, 32px corners, 36/32px inset, a 20px bold title. */
function Card({
  heading,
  badge,
  children,
}: {
  heading: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-[32px] bg-neutral-25 px-5 py-8 sm:px-9">
      <div className="flex items-center justify-between gap-3">
        <h2 className="stretch-90 text-[20px] font-bold leading-8 text-ink">{heading}</h2>
        {badge}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

/** One label/value row — white, 12px corners, label #666E73 16/24, value 16/20 medium, right-aligned. */
function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] bg-white p-3">
      <p className="stretch-90 shrink-0 text-[16px] leading-6 text-neutral-700">{label}</p>
      <p className="min-w-0 flex-1 text-right text-[16px] font-medium leading-5 text-neutral-800 [overflow-wrap:anywhere]">
        {value || '—'}
      </p>
    </div>
  );
}

const BADGE_TONE_CLASSES: Record<'neutral' | 'success', string> = {
  neutral: 'bg-neutral-100 text-neutral-800',
  success: 'bg-[#e6f7ee] text-[#3a9d75]',
};

function Badge({ tone, children }: { tone: 'neutral' | 'success'; children: React.ReactNode }) {
  return (
    <span
      className={`shrink-0 rounded-full px-4 py-1 text-[14px] font-medium leading-5 ${BADGE_TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[52px] min-h-11 px-4 py-2 text-[16px] leading-6 transition-colors duration-standard ${
        active
          ? 'bg-neutral-700 font-medium text-white'
          : 'font-normal text-neutral-800 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  );
}

function WarnGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3 18 16.5H2L10 3Z" stroke="#e8743b" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 8.5v3.5" stroke="#e8743b" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="14" r=".8" fill="#e8743b" />
    </svg>
  );
}

function DocGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-neutral-600"
    >
      <rect x="3" y="3" width="14" height="14" rx="3" fill="currentColor" opacity=".25" />
      <path
        d="M6.5 8h7M6.5 11h7M6.5 14h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DocumentRow({
  document,
  kinds,
  openLabel,
}: {
  document: OrderDocument;
  kinds: Record<string, string>;
  openLabel: string;
}) {
  return (
    <li>
      <a
        href={document.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${openLabel}: ${document.name}`}
        className="flex min-h-12 items-center gap-3 rounded-[12px] bg-white px-4 py-3 text-[14px] leading-5 text-neutral-800 transition-colors duration-standard hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <DocGlyph />
        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{document.name}</span>
        <span className="shrink-0 text-[12px] text-neutral-600">{kinds[document.kind]}</span>
      </a>
    </li>
  );
}

function DocumentList({
  documents,
  empty,
  kinds,
  openLabel,
}: {
  documents: OrderDocument[];
  empty: string;
  kinds: Record<string, string>;
  openLabel: string;
}) {
  if (documents.length === 0) {
    return (
      <p className="rounded-[32px] bg-neutral-25 px-6 py-10 text-center text-[16px] text-neutral-700">
        {empty}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2 rounded-[32px] bg-neutral-25 px-4 py-6 sm:px-9">
      {documents.map((document) => (
        <DocumentRow key={document.id} document={document} kinds={kinds} openLabel={openLabel} />
      ))}
    </ul>
  );
}

/** Everything uploaded, newest first, under "2 days ago"-style headings (Figma 441:7514). */
function DocumentsByAge({
  documents,
  t,
}: {
  documents: OrderDocument[];
  t: {
    empty: string;
    today: string;
    daysAgo: string;
    weekAgo: string;
    weeksAgo: string;
    monthsAgo: string;
    kinds: Record<string, string>;
    open: string;
  };
}) {
  const [now] = useState(() => Date.now());
  if (documents.length === 0) {
    return (
      <p className="rounded-[32px] bg-neutral-25 px-6 py-10 text-center text-[16px] text-neutral-700">
        {t.empty}
      </p>
    );
  }

  const label = (iso: string) => {
    const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
    if (days < 1) return t.today;
    if (days < 7) return interpolate(t.daysAgo, { n: String(days) });
    if (days < 14) return t.weekAgo;
    if (days < 30) return interpolate(t.weeksAgo, { n: String(Math.floor(days / 7)) });
    return interpolate(t.monthsAgo, { n: String(Math.max(1, Math.floor(days / 30))) });
  };

  const groups: { label: string; items: OrderDocument[] }[] = [];
  for (const document of [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const heading = label(document.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === heading) last.items.push(document);
    else groups.push({ label: heading, items: [document] });
  }

  return (
    <div className="flex flex-col gap-6 rounded-[32px] bg-neutral-25 px-4 py-6 sm:px-9">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="text-[14px] font-bold leading-[18px] text-ink">{group.label}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {group.items.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                kinds={t.kinds}
                openLabel={t.open}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
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

  const chip =
    'flex min-w-fit flex-1 items-center gap-1 rounded-[52px] px-4 py-1.5 text-[14px] leading-[18px]';

  return (
    <div className="flex flex-col gap-9 rounded-[32px] bg-white p-8">
      <div className="flex flex-col gap-4">
        <h2 className="stretch-90 text-[20px] font-bold leading-8 text-ink">{t.heading}</h2>
        <p className="text-[12px] leading-4 text-neutral-700">{t.subtitle}</p>
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-bold leading-4 text-neutral-700">{t.actionsLabel}</p>
          {noActions ? (
            <div className="flex items-center gap-1 rounded-[12px] bg-[rgba(207,255,224,0.4)] py-2.5 pl-2 pr-1.5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="8.3" fill="#3a9d75" />
                <path
                  d="m6.5 10.2 2.4 2.4 4.6-5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-[14px] leading-[18px] text-[#3a9d75]">{t.noActionsNeeded}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {order.blockers.map((code) => (
                <li
                  key={code}
                  className="rounded-[12px] bg-error-light/40 px-3 py-2 text-[14px] leading-[18px] text-neutral-800"
                >
                  {reason(code)}
                </li>
              ))}
              {order.warnings.map((code) => (
                <li
                  key={code}
                  className="rounded-[12px] bg-warn-light/40 px-3 py-2 text-[14px] leading-[18px] text-neutral-800"
                >
                  {reason(code)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-4">
          <span className={`${chip} bg-[#b23a48] text-[#ffd1d1]`}>
            <span className="font-medium">{t.blockers}</span>
            <span className="font-bold">{order.blockers.length}</span>
          </span>
          <span className={`${chip} bg-[#fff0b3] text-[#ff9e6d]`}>
            <span className="font-medium">{t.warnings}</span>
            <span className="font-bold">{order.warnings.length}</span>
          </span>
          <span className={`${chip} bg-[#bfe9ff] text-[#4b7bec]`}>
            <span className="font-medium">{t.updates}</span>
            <span className="font-bold">0</span>
          </span>
        </div>
        <hr className="border-0 border-t border-neutral-50" />
        <div className="flex flex-col gap-3 text-neutral-700">
          <p className="text-[16px] font-bold leading-5">
            {order.blockers.length === 0
              ? t.noBlockersHeading
              : `${t.blockers} (${order.blockers.length})`}
          </p>
          <p className="text-[12px] leading-4">
            {order.blockers.length === 0
              ? t.noBlockersBody
              : order.blockers.map(reason).join(' · ')}
          </p>
        </div>
      </div>
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
