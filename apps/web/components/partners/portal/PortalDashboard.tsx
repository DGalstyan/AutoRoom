'use client';

import Image from 'next/image';
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

  const [me, setMe] = useState<PortalIdentity | null>(null);
  const [cars, setCars] = useState<PortalCar[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'cars' | 'orders' | 'bookings'>('cars');
  const [originFilter, setOriginFilter] = useState<CarOrigin | 'ALL'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string | 'ALL'>('ALL');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
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

  const filteredOrders = useMemo(() => {
    const list = orders ?? [];
    const term = orderSearch.trim().toLowerCase();
    const filtered = list.filter((order) => {
      if (originFilter !== 'ALL' && order.car.origin !== originFilter) return false;
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
  }, [orders, originFilter, branchFilter, orderSearch, dateSort]);

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

  return (
    <div className="mx-auto max-w-[1344px] px-4 py-16 sm:px-6 lg:py-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-[40px] font-display text-home-h2 font-light text-ink">
            {greeting(t.dashboard)}, {identity?.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-2 text-body text-neutral-700">
            {me.company ?? me.name} — {t.dashboard.subheading}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="h-11 shrink-0 rounded-pill border border-line-light px-5 text-[14px] font-medium text-ink transition-colors hover:bg-neutral-25"
        >
          {t.dashboard.logout}
        </button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.dashboard.stats.cars} value={me.counts.cars} />
        <StatCard label={t.dashboard.stats.publishedCars} value={me.counts.publishedCars} />
        <StatCard label={t.dashboard.stats.upcomingBookings} value={me.counts.upcomingBookings} />
        <StatCard label={t.dashboard.stats.bookings} value={me.counts.bookings} />
      </div>

      <h2 className="mt-12 text-h3 font-display font-light text-ink">
        {t.dashboard.stageStats.heading}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={t.dashboard.stageStats.active} value={me.orderStats.stageCounts.active} />
        <StatCard
          label={t.dashboard.stageStats.loading}
          value={me.orderStats.stageCounts.loading}
        />
        <StatCard
          label={t.dashboard.stageStats.inTransit}
          value={me.orderStats.stageCounts.inTransit}
        />
        <StatCard
          label={t.dashboard.stageStats.arrived}
          value={me.orderStats.stageCounts.arrived}
        />
        <StatCard
          label={t.dashboard.stageStats.delivered}
          value={me.orderStats.stageCounts.delivered}
        />
      </div>

      <h2 className="mt-12 text-h3 font-display font-light text-ink">
        {t.dashboard.paymentStats.heading}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t.dashboard.paymentStats.pending}
          value={me.orderStats.paymentSummary.pending}
        />
        <StatCard
          label={t.dashboard.paymentStats.partial}
          value={me.orderStats.paymentSummary.partial}
        />
        <StatCard label={t.dashboard.paymentStats.paid} value={me.orderStats.paymentSummary.paid} />
      </div>

      <div className="mt-12 flex gap-2 border-b border-line-light">
        <TabButton active={tab === 'cars'} onClick={() => setTab('cars')}>
          {t.dashboard.carsHeading} ({cars.length})
        </TabButton>
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>
          {t.dashboard.ordersHeading} ({orders.length})
        </TabButton>
        <TabButton active={tab === 'bookings'} onClick={() => setTab('bookings')}>
          {t.dashboard.bookingsHeading} ({bookings.length})
        </TabButton>
      </div>

      {tab === 'cars' &&
        (cars.length === 0 ? (
          <Empty message={t.dashboard.noCars} />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} t={t.dashboard} />
            ))}
          </div>
        ))}

      {tab === 'orders' &&
        (orders.length === 0 ? (
          <Empty message={t.dashboard.noOrders} />
        ) : (
          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                active={originFilter === 'ALL'}
                onClick={() => setOriginFilter('ALL')}
                label={`${t.dashboard.filters.all} (${orderCounts.ALL})`}
              />
              <FilterPill
                active={originFilter === 'CHINA'}
                onClick={() => setOriginFilter('CHINA')}
                label={`${nav.china} (${orderCounts.CHINA})`}
              />
              <FilterPill
                active={originFilter === 'USA'}
                onClick={() => setOriginFilter('USA')}
                label={`${nav.usa} (${orderCounts.USA})`}
              />

              <select
                value={dateSort}
                onChange={(event) => setDateSort(event.target.value as 'desc' | 'asc')}
                aria-label={t.dashboard.ordersTable.date}
                className="h-9 rounded-pill border border-line-light bg-white px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="desc">{t.dashboard.filters.sortNewest}</option>
                <option value="asc">{t.dashboard.filters.sortOldest}</option>
              </select>

              {branchOptions.length > 0 && (
                <select
                  value={branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                  aria-label={t.dashboard.ordersTable.branch}
                  className="h-9 rounded-pill border border-line-light bg-white px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="ALL">{t.dashboard.filters.allBranches}</option>
                  {branchOptions.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder={t.dashboard.filters.searchPlaceholder}
                className="ml-auto h-9 min-w-[200px] rounded-pill border border-line-light bg-white px-4 text-[13px] text-ink outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-line-light">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-line-light bg-neutral-25">
                      <Th>{t.dashboard.ordersTable.date}</Th>
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
                      <tr key={order.id} className="border-b border-line-light last:border-0">
                        <Td>{formatDate(order.createdAt)}</Td>
                        <Td>{order.orderNumber}</Td>
                        <Td>{order.car.vin ?? '—'}</Td>
                        <Td>{order.car.make}</Td>
                        <Td>{order.car.model}</Td>
                        <Td>
                          <OrderStageChip stage={order.stage} t={t.dashboard.orderStage} />
                        </Td>
                        <Td>{order.car.origin === 'CHINA' ? nav.china : nav.usa}</Td>
                        <Td>{order.car.location ?? '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

      {tab === 'bookings' &&
        (bookings.length === 0 ? (
          <Empty message={t.dashboard.noBookings} />
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-line-light">
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
                        <BookingStatusChip status={booking.status} t={t.dashboard.bookingStatus} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line-light px-5 py-4">
      <p className="text-small text-neutral-700">{label}</p>
      <p className="mt-1 font-display text-h3 font-light text-ink">{value}</p>
    </div>
  );
}

function TabButton({
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
      className={`-mb-px border-b-2 px-1 py-3 text-[14px] font-medium transition-colors ${
        active ? 'border-ink text-ink' : 'border-transparent text-neutral-700 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function CarCard({
  car,
  t,
}: {
  car: PortalCar;
  t: ReturnType<typeof useMessages>['partners']['portal']['dashboard'];
}) {
  const cover = car.images.find((image) => image.album === 'EXTERIOR') ?? car.images[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-line-light">
      <div className="relative aspect-[16/10] bg-neutral-25">
        {cover ? (
          <Image
            src={cover.thumbnailUrl ?? cover.url}
            alt=""
            fill
            sizes="360px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-small text-neutral-700">
            {t.noCars}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-[16px] font-semibold text-ink">
            {car.make} {car.model}
          </p>
          <span
            className={`shrink-0 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${
              car.publishedAt ? 'bg-success/15 text-success' : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {car.publishedAt ? t.live : t.draft}
          </span>
        </div>

        <p className="mt-1 text-small text-neutral-700">
          {car.year} · {t.condition[car.condition]}
          {car.location ? ` · ${car.location}` : ''}
        </p>

        <p className="mt-2 text-[18px] font-semibold text-ink">{formatMoney(car.price)}</p>

        {car.vin && (
          <p className="mt-2 font-mono text-[11px] text-neutral-700">
            {t.vin} {car.vin}
          </p>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 rounded-pill px-4 text-[13px] font-medium transition-colors ${
        active ? 'bg-ink text-white' : 'bg-neutral-25 text-neutral-700 hover:bg-neutral-100'
      }`}
    >
      {label}
    </button>
  );
}

function OrderStageChip({
  stage,
  t,
}: {
  stage: OrderStageName;
  t: Record<OrderStageName, string>;
}) {
  const tone: Record<OrderStageName, string> = {
    CREATED: 'bg-neutral-100 text-neutral-700',
    LOADING: 'bg-warn/15 text-warn',
    IN_TRANSIT: 'bg-info/15 text-info',
    ARRIVED: 'bg-info/15 text-info',
    DELIVERED: 'bg-success/15 text-success',
  };
  return (
    <span className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${tone[stage]}`}>
      {t[stage]}
    </span>
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
    <div className="mt-8 rounded-2xl border border-line-light py-16 text-center">
      <p className="text-body text-neutral-700">{message}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-small font-medium text-neutral-700">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-[14px] text-ink">{children}</td>;
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
