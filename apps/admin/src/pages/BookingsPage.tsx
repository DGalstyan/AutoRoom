import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking, BookingStatus } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { brand, mono } from '@/theme';
import { BookingCalendar } from '@/pages/bookings/BookingCalendar';
import { BookingDialog, toInput } from '@/pages/bookings/BookingDialog';
import { STATUSES, statusTone } from '@/pages/bookings/status';
import { formatDateTime, formatTime } from '@/pages/availability/time';

type View = 'list' | 'calendar';

/** Appointments, across every partner. A partner sees only their own, in the portal. */
export function BookingsPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>('list');
  const [partnerId, setPartnerId] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; booking: Booking } | null>(null);
  const [editing, setEditing] = useState<{ booking?: Booking } | null>(null);
  const [deleting, setDeleting] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);

  const canCreate = identity?.permissions.includes('bookings:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('bookings:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('bookings:DELETE') ?? false;
  const canReadPartners = identity?.permissions.includes('partners:READ') ?? false;

  const bookingsQuery = useQuery({
    queryKey: ['bookings', partnerId, status],
    queryFn: () =>
      api.bookings.list({
        ...(partnerId ? { partnerId } : {}),
        ...(status ? { status } : {}),
        take: 100,
      }),
  });

  const partnersQuery = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.partners.list({ take: 100 }),
    enabled: canReadPartners,
  });

  /**
   * Availability is invalidated alongside bookings: confirming or cancelling
   * changes which slots are open, and a diary still showing a freed slot as
   * taken is the failure this screen exists to avoid.
   */
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    void queryClient.invalidateQueries({ queryKey: ['availability'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ booking, next }: { booking: Booking; next: BookingStatus }) =>
      api.bookings.update(booking.id, { ...toInput(booking), status: next }),
    onSuccess: (booking) => {
      toast(`Marked ${booking.status.toLowerCase()}.`);
      setCancelling(null);
      refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.bookings.remove(id),
    onSuccess: () => {
      toast('Booking deleted.');
      setDeleting(null);
      refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const bookings = bookingsQuery.data?.items ?? [];
  const partners = partnersQuery.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Bookings
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Viewings and handovers. Partners see their own in the portal.
          </Typography>
        </Box>

        {canCreate && canReadPartners && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add booking
          </Button>
        )}
      </Stack>

      {/* The calendar is not a table, so it does not go through DataTable —
          forcing it through would mean a "column" abstraction that describes
          neither. Both branches share one filter bar so switching view never
          moves the controls. */}
      {view === 'calendar' ? (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              p: 2,
              borderBottom: `1px solid ${brand.lineLight}`,
              alignItems: { sm: 'center' },
            }}
          >
            {canReadPartners && (
              <TextField
                label="Partner"
                value={partnerId}
                onChange={(event) => setPartnerId(event.target.value)}
                select
                size="small"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All partners</MenuItem>
                {partners.map((partner) => (
                  <MenuItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as BookingStatus | '')}
              select
              size="small"
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="">Any status</MenuItem>
              {STATUSES.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>

            <ToggleButtonGroup
              value={view}
              exclusive
              size="small"
              onChange={(_event, next: View | null) => next && setView(next)}
              sx={{ ml: { sm: 'auto' } }}
            >
              <ToggleButton value="list" aria-label="List view">
                <ViewListIcon sx={{ fontSize: 18, mr: 0.75 }} /> List
              </ToggleButton>
              <ToggleButton value="calendar" aria-label="Calendar view">
                <CalendarMonthIcon sx={{ fontSize: 18, mr: 0.75 }} /> Calendar
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          {bookingsQuery.isPending ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
              <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
            </Box>
          ) : bookingsQuery.isError ? (
            <Alert severity="error" sx={{ m: 3 }}>
              {errorMessage(bookingsQuery.error, 'Could not load bookings.')}
            </Alert>
          ) : (
            <BookingCalendar
              bookings={bookings}
              onSelect={(booking) => canUpdate && canReadPartners && setEditing({ booking })}
            />
          )}
        </Paper>
      ) : (
        <DataTable
          rows={bookings}
          getRowId={(booking) => booking.id}
          isPending={bookingsQuery.isPending}
          error={bookingsQuery.isError ? bookingsQuery.error : undefined}
          errorMessage="Could not load bookings."
          emptyMessage="No bookings match these filters."
          minWidth={940}
          toolbar={
            <>
              {canReadPartners && (
                <TextField
                  label="Partner"
                  value={partnerId}
                  onChange={(event) => setPartnerId(event.target.value)}
                  select
                  size="small"
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">All partners</MenuItem>
                  {partners.map((partner) => (
                    <MenuItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <TextField
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as BookingStatus | '')}
                select
                size="small"
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">Any status</MenuItem>
                {STATUSES.map((entry) => (
                  <MenuItem key={entry.value} value={entry.value}>
                    {entry.label}
                  </MenuItem>
                ))}
              </TextField>

              <ToggleButtonGroup
                value={view}
                exclusive
                size="small"
                onChange={(_event, next: View | null) => next && setView(next)}
                sx={{ ml: { sm: 'auto' } }}
              >
                <ToggleButton value="list" aria-label="List view">
                  <ViewListIcon sx={{ fontSize: 18, mr: 0.75 }} /> List
                </ToggleButton>
                <ToggleButton value="calendar" aria-label="Calendar view">
                  <CalendarMonthIcon sx={{ fontSize: 18, mr: 0.75 }} /> Calendar
                </ToggleButton>
              </ToggleButtonGroup>
            </>
          }
          columns={[
            {
              key: 'when',
              header: 'When',
              render: (booking) => (
                <>
                  <Typography sx={{ fontSize: '0.875rem' }}>
                    {formatDateTime(booking.scheduledAt)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
                    {booking.slot
                      ? `Slot until ${formatTime(booking.slot.endsAt)}${
                          booking.slot.branch ? ` · ${booking.slot.branch.name}` : ''
                        }`
                      : 'No slot — booked directly'}
                  </Typography>
                </>
              ),
            },
            {
              key: 'partner',
              header: 'Partner',
              render: (booking) => (
                <Typography sx={{ fontSize: '0.875rem' }}>{booking.partner.name}</Typography>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              render: (booking) => (
                <Box sx={{ fontSize: '0.875rem' }}>
                  {booking.customerName ?? '—'}
                  {booking.customerPhone && (
                    <Typography
                      sx={{ fontFamily: mono, fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                      {booking.customerPhone}
                    </Typography>
                  )}
                </Box>
              ),
            },
            {
              key: 'car',
              header: 'Car',
              render: (booking) => (
                <Typography sx={{ fontSize: '0.875rem' }}>
                  {booking.car
                    ? `${booking.car.make} ${booking.car.model} ${booking.car.year}`
                    : '—'}
                </Typography>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (booking) => <StatusChip status={booking.status} />,
            },
            {
              key: 'actions',
              align: 'right',
              render: (booking) => (
                <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                  {/* Confirm and cancel are the two things done to a booking
                      often enough to deserve their own buttons rather than a
                      trip through the overflow menu. */}
                  {canUpdate && booking.status === 'REQUESTED' && (
                    <Tooltip title="Confirm">
                      <IconButton
                        size="small"
                        aria-label="Confirm booking"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ booking, next: 'CONFIRMED' })}
                        sx={{ color: brand.success }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canUpdate && booking.status !== 'CANCELLED' && (
                    <Tooltip title="Cancel">
                      <IconButton
                        size="small"
                        aria-label="Cancel booking"
                        disabled={statusMutation.isPending}
                        onClick={() => setCancelling(booking)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(canUpdate || canDelete) && (
                    <IconButton
                      size="small"
                      aria-label="Actions"
                      onClick={(event) => setMenu({ anchor: event.currentTarget, booking })}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ),
            },
          ]}
        />
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {canUpdate && canReadPartners && (
          <MenuItem
            onClick={() => {
              if (menu) setEditing({ booking: menu.booking });
              setMenu(null);
            }}
          >
            Edit
          </MenuItem>
        )}
        {canUpdate &&
          menu &&
          STATUSES.filter((entry) => entry.value !== menu.booking.status).map((entry) => (
            <MenuItem
              key={entry.value}
              onClick={() => {
                statusMutation.mutate({ booking: menu.booking, next: entry.value });
                setMenu(null);
              }}
            >
              Mark {entry.label.toLowerCase()}
            </MenuItem>
          ))}
        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.booking);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <BookingDialog
          booking={editing.booking}
          partners={partners}
          onClose={() => setEditing(null)}
          onDone={(message) => {
            setEditing(null);
            toast(message);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this booking?"
        message="It stays on the record as cancelled, and its slot goes back on offer to other partners."
        confirmLabel="Cancel booking"
        destructive
        busy={statusMutation.isPending}
        onConfirm={() =>
          cancelling && statusMutation.mutate({ booking: cancelling, next: 'CANCELLED' })
        }
        onClose={() => setCancelling(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this booking?"
        message="The appointment will be removed and will disappear from the partner's portal."
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}

function StatusChip({ status }: { status: BookingStatus }) {
  const entry = statusTone(status);
  return <StatusBadge label={entry.label} tone={entry.tone} />;
}
