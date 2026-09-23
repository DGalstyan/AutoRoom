'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Booking, BookingStatus, PortalCar, PortalIdentity } from '@autoroom/api/client';
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
 * 9Lq4XpWusTJj1VnM6laAZr) — greeting, a stat row, then the car list — but the
 * stats are the four `/portal/me` actually returns (cars assigned / live on
 * the site / upcoming bookings / bookings total), not the mock's five-stage
 * shipping breakdown (created → loading → in transit → arrived →
 * delivered): that pipeline isn't modelled in the database yet (no
 * Order/OrderStage — see `ADMIN-TASKS.md` Phase C4), so showing it here
 * would be inventing data. A bookings table is added below the cars grid —
 * in the API response but absent from this particular Figma frame — mirroring
 * `apps/admin/src/pages/portal/PortalPage.tsx`, the existing (admin-hosted)
 * partner-facing view of the same endpoints.
 */
export function PortalDashboard() {
  const t = useMessages().partners.portal;
  const { identity, api, signOut } = usePortalAuth();

  const [me, setMe] = useState<PortalIdentity | null>(null);
  const [cars, setCars] = useState<PortalCar[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'cars' | 'bookings'>('cars');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.portal.me(), api.portal.cars(), api.portal.bookings()])
      .then(([meRes, carsRes, bookingsRes]) => {
        if (cancelled) return;
        setError(null);
        setMe(meRes);
        setCars(carsRes.items);
        setBookings(bookingsRes.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err, t.errors.loadFailed));
      });
    return () => {
      cancelled = true;
    };
  }, [api, t.errors.loadFailed]);

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

  if (!me || !cars || !bookings) {
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
          <h1 className="font-display text-home-h2 font-light text-ink">
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

      <div className="mt-12 flex gap-2 border-b border-line-light">
        <TabButton active={tab === 'cars'} onClick={() => setTab('cars')}>
          {t.dashboard.carsHeading} ({cars.length})
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
          <Image src={cover.url} alt="" fill sizes="360px" className="object-cover" />
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

function formatMoney(amount: number) {
  return `${amount.toLocaleString('en-US')} $`;
}

function greeting(t: ReturnType<typeof useMessages>['partners']['portal']['dashboard']) {
  const hour = new Date().getHours();
  if (hour < 12) return t.greetingMorning;
  if (hour < 18) return t.greetingAfternoon;
  return t.greetingEvening;
}
