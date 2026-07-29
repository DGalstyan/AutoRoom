import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Booking, BookingStatus, PortalCar } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { CONDITION_LABEL, formatMoney } from '@/pages/cars/carOptions';
import { brand, mono } from '@/theme';

type TabKey = 'cars' | 'bookings';

/**
 * The partner portal.
 *
 * Everything here comes from `/portal/*`, which scopes to the signed-in
 * account's partner server-side — no request carries a partner id, so this
 * screen has no way to ask for someone else's rows even if it tried.
 *
 * It is read-only by design. A partner seeing their cars and appointments is
 * the whole of what was asked for; letting them edit either would need an
 * approval path that does not exist yet.
 */
export function PortalPage() {
  const { api, identity } = useAuth();
  const [tab, setTab] = useState<TabKey>('cars');

  const meQuery = useQuery({ queryKey: ['portal', 'me'], queryFn: () => api.portal.me() });
  const carsQuery = useQuery({ queryKey: ['portal', 'cars'], queryFn: () => api.portal.cars() });
  const bookingsQuery = useQuery({
    queryKey: ['portal', 'bookings'],
    queryFn: () => api.portal.bookings(),
  });

  if (meQuery.isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
        <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  }

  if (meQuery.isError) {
    return (
      <Alert severity="error">
        {errorMessage(meQuery.error, 'Could not load your partner account.')}
      </Alert>
    );
  }

  const me = meQuery.data!;
  const cars = carsQuery.data?.items ?? [];
  const bookings = bookingsQuery.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        Partner portal
      </Typography>
      <Typography variant="h2" sx={{ mt: 0.5, mb: 0.5 }}>
        {greeting()}, {identity?.name.split(' ')[0]}.
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 4 }}>
        {me.company ?? me.name} — the cars assigned to you and your upcoming appointments.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Fact label="Cars assigned" value={String(me.counts.cars)} />
        <Fact label="Live on the site" value={String(me.counts.publishedCars)} />
        <Fact label="Upcoming bookings" value={String(me.counts.upcomingBookings)} />
        <Fact label="Bookings total" value={String(me.counts.bookings)} />
      </Stack>

      <Tabs
        value={tab}
        onChange={(_event, value: TabKey) => setTab(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`My cars (${cars.length})`} value="cars" />
        <Tab label={`Bookings (${bookings.length})`} value="bookings" />
      </Tabs>

      {tab === 'cars' &&
        (carsQuery.isPending ? (
          <Loading />
        ) : carsQuery.isError ? (
          <Alert severity="error">
            {errorMessage(carsQuery.error, 'Could not load your cars.')}
          </Alert>
        ) : cars.length === 0 ? (
          <Empty message="No cars are assigned to you yet." />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
              gap: 2.5,
            }}
          >
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </Box>
        ))}

      {tab === 'bookings' &&
        (bookingsQuery.isPending ? (
          <Loading />
        ) : bookingsQuery.isError ? (
          <Alert severity="error">
            {errorMessage(bookingsQuery.error, 'Could not load your bookings.')}
          </Alert>
        ) : bookings.length === 0 ? (
          <Empty message="No bookings yet." />
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Car</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id} hover>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {formatWhen(booking.scheduledAt)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {booking.customerName ?? '—'}
                        {booking.customerPhone && (
                          <Typography
                            sx={{ fontFamily: mono, fontSize: '0.75rem', color: 'text.secondary' }}
                          >
                            {booking.customerPhone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {booking.car
                          ? `${booking.car.make} ${booking.car.model} ${booking.car.year}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <BookingChip status={booking.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        ))}
    </Box>
  );
}

function CarCard({ car }: { car: PortalCar }) {
  const cover = car.images.find((image) => image.album === 'EXTERIOR') ?? car.images[0];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          aspectRatio: '16 / 10',
          bgcolor: brand.surfaceLight,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {cover ? (
          <Box
            component="img"
            src={cover.url}
            alt=""
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>No photo</Typography>
        )}
      </Box>

      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
            {car.make} {car.model}
          </Typography>
          <Chip
            label={car.publishedAt ? 'Live' : 'Draft'}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: car.publishedAt ? brand.success : brand.muted,
              bgcolor: `${car.publishedAt ? brand.success : brand.muted}18`,
            }}
          />
        </Stack>

        <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mb: 1.5 }}>
          {car.year} · {CONDITION_LABEL[car.condition]}
          {car.location ? ` · ${car.location}` : ''}
        </Typography>

        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
          {formatMoney(car.price)}
        </Typography>

        {car.vin && (
          <Typography
            sx={{ fontFamily: mono, fontSize: '0.6875rem', color: 'text.secondary', mt: 1 }}
          >
            VIN {car.vin}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

function BookingChip({ status }: { status: BookingStatus }) {
  const tone = {
    REQUESTED: { color: brand.warn, label: 'Requested' },
    CONFIRMED: { color: brand.success, label: 'Confirmed' },
    COMPLETED: { color: brand.info, label: 'Completed' },
    CANCELLED: { color: brand.muted, label: 'Cancelled' },
  }[status];

  return (
    <Chip
      label={tone.label}
      size="small"
      sx={{
        height: 22,
        fontSize: '0.6875rem',
        fontWeight: 600,
        color: tone.color,
        bgcolor: `${tone.color}18`,
      }}
    />
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ px: 2.5, py: 2, borderRadius: 3, flex: 1, minWidth: 0 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.375rem', fontWeight: 600, mt: 0.5 }}>{value}</Typography>
    </Paper>
  );
}

function Loading() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
      <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
    </Box>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary' }}>{message}</Typography>
    </Paper>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export type { Booking };
