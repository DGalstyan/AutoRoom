'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type {
  Booking,
  BookingStatus,
  CarOrigin,
  Order,
  OrderStageName,
  PortalCar,
  PortalIdentity,
} from '@autoroom/api/client';
import { ListDropdown } from '@/components/china/FilterDropdowns';
import { useMessages } from '@/components/shared/LocaleProvider';
import { errorMessage } from '@/lib/portal/api';
import { usePortalAuth } from '@/components/partners/portal/PortalAuthProvider';

/**
 * `/partners/portal/dashboard` — everything comes from `/portal/*`, which
 * the API scopes to the signed-in account's partner server-side (see
 * `apps/api/src/middleware/partner.ts`). No request here carries a partner
 * id, so there is no parameter that could leak someone else's rows.
 *
 * Structure follows Figma node 378:6117 ("Dealers portal", file
 * 9Lq4XpWusTJj1VnM6laAZr) — greeting, the cars-assigned stat row, the
 * five-stage shipping breakdown, the payments summary, then the cars grid
 * and an orders table with country filters (Phase C4 — `ADMIN-TASKS.md` —
 * landed the `Order`/`OrderStage`/`Payment` models this reads). A bookings
 * tab sits alongside the two Figma tabs — in the API response but absent
 * from this particular frame — mirroring
 * `apps/admin/src/pages/portal/PortalPage.tsx`, the existing (admin-hosted)
 * partner-facing view of the same endpoints.
 */
export function PortalDashboard() {
  const t = useMessages().partners.portal;
  const nav = useMessages().common.nav;
  const { identity, api, signOut } = usePortalAuth();
  const router = useRouter();

  const [me, setMe] = useState<PortalIdentity | null>(null);
  const [cars, setCars] = useState<PortalCar[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'cars' | 'orders' | 'bookings'>('orders');
  const [stageFilter, setStageFilter] = useState<OrderStageName | null>(null);
  // The date dropdown's own labels double as its values; '' means the default (newest first).
  const [dateChoice, setDateChoice] = useState('');
  const [originFilter, setOriginFilter] = useState<CarOrigin | 'ALL'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string | 'ALL'>('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.portal.me(), api.portal.cars(), api.portal.bookings(), api.portal.orders()])
      .then(([meRes, carsRes, bookingsRes, ordersRes]) => {
        if (cancelled) return;
        setError(null);
        setMe(meRes);
        setCars(carsRes.items);
        setBookings(bookingsRes.items);
        setOrders(ordersRes.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err, t.errors.loadFailed));
      });
    return () => {
      cancelled = true;
    };
  }, [api, t.errors.loadFailed]);

  const orderCounts = useMemo(() => {
    const list = orders ?? [];
    return {
      ALL: list.length,
      CHINA: list.filter((order) => order.car.origin === 'CHINA').length,
      USA: list.filter((order) => order.car.origin === 'USA').length,
    };
  }, [orders]);

  /** Distinct branches across this partner's orders — nothing to pick from
   * until at least one order's car has a `location` set. */
  const branchOptions = useMemo(() => {
    const list = orders ?? [];
    const seen = new Set<string>();
    for (const order of list) if (order.car.location) seen.add(order.car.location);
    return Array.from(seen).sort();
  }, [orders]);

  const dateSort: 'desc' | 'asc' = dateChoice === t.dashboard.filters.sortOldest ? 'asc' : 'desc';

  const filteredOrders = useMemo(() => {
    const list = orders ?? [];
    const term = orderSearch.trim().toLowerCase();
    const filtered = list.filter((order) => {
      if (originFilter !== 'ALL' && order.car.origin !== originFilter) return false;
      if (stageFilter && order.stage !== stageFilter) return false;
      if (branchFilter !== 'ALL' && order.car.location !== branchFilter) return false;
      if (!term) return true;
      return (
        order.orderNumber.toLowerCase().includes(term) ||
        (order.car.vin?.toLowerCase().includes(term) ?? false) ||
        order.car.make.toLowerCase().includes(term) ||
        order.car.model.toLowerCase().includes(term)
      );
    });
    return [...filtered].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return dateSort === 'asc' ? diff : -diff;
    });
  }, [orders, originFilter, branchFilter, orderSearch, dateSort, stageFilter]);

  if (error) {
    return (
      <div className="mx-auto max-w-[1344px] px-4 py-24 text-center sm:px-6">
        <p className="text-body text-accent">{error}</p>
        {/* A signed-in-but-not-a-partner account (e.g. a stale staff session
            in this browser) would otherwise be stuck here with no way back
            to the login form for a different account. */}
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 text-small font-medium text-ink underline underline-offset-2"
        >
          {t.dashboard.logout}
        </button>
      </div>
    );
  }

  if (!me || !cars || !bookings || !orders) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="size-8 animate-spin rounded-full border-2 border-neutral-500 border-t-ink"
          aria-hidden
        />
      </div>
    );
  }

  const stageCards: { label: string; value: number; stage: OrderStageName | null }[] = [
    { label: t.dashboard.stageStats.active, value: me.orderStats.stageCounts.active, stage: null },
    {
      label: t.dashboard.stageStats.loading,
      value: me.orderStats.stageCounts.loading,
      stage: 'LOADING',
    },
    {
      label: t.dashboard.stageStats.inTransit,
      value: me.orderStats.stageCounts.inTransit,
      stage: 'IN_TRANSIT',
    },
    {
      label: t.dashboard.stageStats.arrived,
      value: me.orderStats.stageCounts.arrived,
      stage: 'ARRIVED',
    },
    {
      label: t.dashboard.stageStats.delivered,
      value: me.orderStats.stageCounts.delivered,
      stage: 'DELIVERED',
    },
  ];

  function showStage(stage: OrderStageName | null) {
    setTab('orders');
    setStageFilter(stage);
    document
      .getElementById('portal-orders')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="mx-auto max-w-page px-4 pb-16 pt-32 sm:px-6 sm:pt-[185px] lg:px-12 lg:pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="stretch-88 text-[28px] font-light leading-[38px] text-ink sm:text-home-h2 sm:leading-[58px]">
          {greeting(t.dashboard)}, {identity?.name.split(' ')[0]} 👋
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-small text-neutral-700 sm:inline">
            {me.company ?? me.name}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="h-11 shrink-0 rounded-pill bg-white px-5 text-[14px] font-medium text-ink transition-colors hover:bg-neutral-50"
          >
            {t.dashboard.logout}
          </button>
        </div>
      </div>

      {/* Figma 441:5557: 64px under the greeting, 56px between a heading and its cards, 64px between groups. */}
      <section className="mt-8 lg:mt-16" aria-labelledby="portal-stage-heading">
        <h2
          id="portal-stage-heading"
          className="stretch-90 text-[24px] font-bold leading-9 text-ink"
        >
          {t.dashboard.stageStats.heading}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-5 lg:gap-6">
          {stageCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              onOpen={() => showStage(card.stage)}
              active={tab === 'orders' && stageFilter === card.stage && card.stage !== null}
            />
          ))}
        </div>
      </section>

      <section className="mt-8 lg:mt-16" aria-labelledby="portal-pay-heading">
        <h2 id="portal-pay-heading" className="stretch-90 text-[24px] font-bold leading-9 text-ink">
          {t.dashboard.paymentStats.heading}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-[repeat(3,267px)] lg:gap-6">
          <StatCard
            label={t.dashboard.paymentStats.pending}
            value={me.orderStats.paymentSummary.pending}
          />
          <StatCard
            label={t.dashboard.paymentStats.partial}
            value={me.orderStats.paymentSummary.partial}
          />
          <StatCard
            label={t.dashboard.paymentStats.paid}
            value={me.orderStats.paymentSummary.paid}
          />
        </div>
      </section>

      <div id="portal-orders" className="mt-8 flex scroll-mt-28 flex-col gap-9 lg:mt-16">
        <div className="flex flex-col gap-4 rounded-[32px] bg-white px-6 py-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6 xl:rounded-[70px]">
          <div
            role="group"
            className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-[24px] bg-neutral-25 px-4 py-3 sm:w-fit sm:rounded-pill"
          >
            <ViewPill
              active={tab === 'orders' && originFilter === 'ALL'}
              onClick={() => {
                setTab('orders');
                setOriginFilter('ALL');
              }}
            >
              {t.dashboard.filters.all}
            </ViewPill>
            <ViewPill
              active={tab === 'orders' && originFilter === 'CHINA'}
              onClick={() => {
                setTab('orders');
                setOriginFilter('CHINA');
              }}
            >
              {nav.china}({orderCounts.CHINA})
            </ViewPill>
            <ViewPill
              active={tab === 'orders' && originFilter === 'USA'}
              onClick={() => {
                setTab('orders');
                setOriginFilter('USA');
              }}
            >
              {nav.usa}({orderCounts.USA})
            </ViewPill>
            <span className="mx-1 hidden h-6 w-px bg-neutral-100 sm:block" aria-hidden="true" />
            <ViewPill active={tab === 'cars'} onClick={() => setTab('cars')}>
              {t.dashboard.carsHeading} ({cars.length})
            </ViewPill>
            <ViewPill active={tab === 'bookings'} onClick={() => setTab('bookings')}>
              {t.dashboard.bookingsHeading} ({bookings.length})
            </ViewPill>
          </div>

          {tab === 'orders' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap xl:gap-8">
              <label className="flex h-9 w-full items-center justify-between rounded-pill bg-neutral-25 px-3 text-[12px] leading-4 text-neutral-700 sm:w-[228px]">
                <span className="sr-only">{t.dashboard.filters.searchLabel}</span>
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder={t.dashboard.filters.searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-700 [&::-webkit-search-cancel-button]:hidden"
                />
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <circle cx="9" cy="9" r="5.5" stroke="#3D3D3D" strokeWidth="1.3" />
                  <path
                    d="m13.5 13.5 3 3"
                    stroke="#3D3D3D"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <ListDropdown
                  label={t.dashboard.ordersTable.date}
                  allLabel={t.dashboard.ordersTable.date}
                  allRowLabel={t.dashboard.filters.sortNewest}
                  options={[t.dashboard.filters.sortOldest]}
                  value={dateChoice}
                  onChange={setDateChoice}
                />
                <ListDropdown
                  label={t.dashboard.ordersTable.branch}
                  allLabel={t.dashboard.ordersTable.branch}
                  allRowLabel={t.dashboard.filters.allBranches}
                  options={branchOptions}
                  value={branchFilter === 'ALL' ? '' : branchFilter}
                  onChange={(next) => setBranchFilter(next || 'ALL')}
                />
              </div>
            </div>
          )}
        </div>

        {tab === 'cars' &&
          (cars.length === 0 ? (
            <Empty message={t.dashboard.noCars} />
          ) : (
            /* Same table language as the orders table (Figma 444:10964): 1px #e5e7e8 frame, black header, alternating rows. */
            <div className="overflow-hidden rounded-[24px] border border-neutral-100 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] table-fixed text-left">
                  <thead>
                    <tr className="bg-ink">
                      <Th first>{t.dashboard.ordersTable.make}</Th>
                      <Th>{t.dashboard.ordersTable.model}</Th>
                      <Th>{t.dashboard.carsTable.year}</Th>
                      <Th>{t.dashboard.ordersTable.vin}</Th>
                      <Th>{t.dashboard.carsTable.price}</Th>
                      <Th>{t.dashboard.ordersTable.status}</Th>
                      <Th>{t.dashboard.carsTable.visibility}</Th>
                      <Th>{t.dashboard.ordersTable.country}</Th>
                      <Th>{t.dashboard.ordersTable.branch}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.map((car) => (
                      <tr key={car.id} className="odd:bg-white even:bg-[#f7f7f7]">
                        <Td first>{car.make}</Td>
                        <Td>{car.model}</Td>
                        <Td>{car.year}</Td>
                        <Td>{car.vin ?? '—'}</Td>
                        <Td>
                          <span className="tabular-nums">{formatMoney(car.price)}</span>
                        </Td>
                        <Td>{t.dashboard.condition[car.condition]}</Td>
                        <Td>
                          <span
                            className={`rounded-pill px-2.5 py-0.5 text-[12px] font-medium ${
                              car.publishedAt
                                ? 'bg-success-light text-success'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {car.publishedAt ? t.dashboard.live : t.dashboard.draft}
                          </span>
                        </Td>
                        <Td>{car.origin === 'CHINA' ? nav.china : nav.usa}</Td>
                        <Td>{car.location ?? '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {tab === 'orders' &&
          (orders.length === 0 ? (
            <Empty message={t.dashboard.noOrders} />
          ) : (
            /* Figma 441:5751: a black 88px header over 72px rows that alternate white / #f7f7f7. */
            <div className="overflow-hidden rounded-[24px] border border-neutral-100 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] table-fixed text-left">
                  <thead>
                    <tr className="bg-ink">
                      <Th first>{t.dashboard.ordersTable.date}</Th>
                      <Th>{t.dashboard.ordersTable.orderNumber}</Th>
                      <Th>{t.dashboard.ordersTable.vin}</Th>
                      <Th>{t.dashboard.ordersTable.make}</Th>
                      <Th>{t.dashboard.ordersTable.model}</Th>
                      <Th>{t.dashboard.ordersTable.status}</Th>
                      <Th>{t.dashboard.ordersTable.country}</Th>
                      <Th>{t.dashboard.ordersTable.branch}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/partners/portal/orders/${order.id}`)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          router.push(`/partners/portal/orders/${order.id}`);
                        }}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer odd:bg-white even:bg-[#f7f7f7] hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                      >
                        <Td first>{formatDate(order.createdAt)}</Td>
                        <Td>{order.orderNumber}</Td>
                        <Td>{order.car.vin ?? '—'}</Td>
                        <Td>{order.car.make}</Td>
                        <Td>{order.car.model}</Td>
                        <Td>{t.dashboard.orderStage[order.stage]}</Td>
                        <Td>{order.car.origin === 'CHINA' ? nav.china : nav.usa}</Td>
                        <Td>{order.car.location ?? '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && (
                <p className="px-6 py-10 text-center text-body text-neutral-700">
                  {t.dashboard.noOrders}
                </p>
              )}
            </div>
          ))}

        {tab === 'bookings' &&
          (bookings.length === 0 ? (
            <Empty message={t.dashboard.noBookings} />
          ) : (
            <div className="overflow-hidden rounded-[24px] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-line-light bg-neutral-25">
                      <Th>{t.dashboard.table.when}</Th>
                      <Th>{t.dashboard.table.customer}</Th>
                      <Th>{t.dashboard.table.car}</Th>
                      <Th>{t.dashboard.table.status}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-line-light last:border-0">
                        <Td>{formatWhen(booking.scheduledAt)}</Td>
                        <Td>
                          {booking.customerName ?? '—'}
                          {booking.customerPhone && (
                            <span className="block text-small text-neutral-700">
                              {booking.customerPhone}
                            </span>
                          )}
                        </Td>
                        <Td>
                          {booking.car
                            ? `${booking.car.make} ${booking.car.model} ${booking.car.year}`
                            : '—'}
                        </Td>
                        <Td>
                          <BookingStatusChip
                            status={booking.status}
                            t={t.dashboard.bookingStatus}
                          />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/** A stat tile — Figma 441:5563: 126px, 32px inset, a 24px bold number with a 22px arrow
 * chip beside it (when the tile opens the matching orders), the label under it. */
function StatCard({
  label,
  value,
  onOpen,
  active = false,
}: {
  label: string;
  value: number;
  onOpen?: () => void;
  active?: boolean;
}) {
  const body = (
    <>
      <span className="flex items-center gap-4">
        <span className="text-[24px] font-bold leading-9 tabular-nums text-ink">{value}</span>
        {onOpen && (
          <span
            aria-hidden="true"
            className="flex size-[22px] items-center justify-center rounded-full bg-[#eceef0] text-neutral-800"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M5 11 11 5M11 5H6M11 5v5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </span>
      <span className="text-[16px] leading-6 text-neutral-800">{label}</span>
    </>
  );
  const base =
    'flex min-h-[126px] flex-col items-start justify-center gap-0.5 rounded-[32px] bg-white p-8 text-left';
  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={active}
      className={`${base} transition-shadow duration-standard hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
        active ? 'ring-2 ring-accent' : ''
      }`}
    >
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}

/** A pill in the panel's view switcher (Figma "Filter item": 52px corners, active #666E73). */
function ViewPill({
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
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[52px] px-4 py-2 text-[16px] leading-6 transition-colors duration-standard ${
        active
          ? 'bg-neutral-700 font-medium text-white'
          : 'font-normal text-neutral-800 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  );
}

function BookingStatusChip({
  status,
  t,
}: {
  status: BookingStatus;
  t: Record<BookingStatus, string>;
}) {
  const tone: Record<BookingStatus, string> = {
    REQUESTED: 'bg-warn/15 text-warn',
    CONFIRMED: 'bg-success/15 text-success',
    COMPLETED: 'bg-info/15 text-info',
    CANCELLED: 'bg-neutral-100 text-neutral-700',
  };
  return (
    <span className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${tone[status]}`}>
      {t[status]}
    </span>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] bg-white py-16 text-center">
      <p className="text-body text-neutral-700">{message}</p>
    </div>
  );
}

function Th({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return (
    <th
      className={`py-6 pr-3 text-[16px] font-medium leading-5 text-neutral-25 ${first ? 'pl-6' : 'pl-3'}`}
    >
      {children}
    </th>
  );
}

function Td({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return (
    <td
      className={`h-[72px] truncate py-4 pr-3 text-[14px] leading-[18px] text-ink ${first ? 'pl-6' : 'pl-3'}`}
    >
      {children}
    </td>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('hy-AM', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('hy-AM', { dateStyle: 'medium' });
}

function formatMoney(amount: number) {
  return `${amount.toLocaleString('en-US')} $`;
}

function greeting(t: ReturnType<typeof useMessages>['partners']['portal']['dashboard']) {
  const hour = new Date().getHours();
  if (hour < 12) return t.greetingMorning;
  if (hour < 18) return t.greetingAfternoon;
  return t.greetingEvening;
}
