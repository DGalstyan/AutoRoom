import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking, BookingInput, BookingStatus } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { brand, mono } from '@/theme';

const STATUSES: { value: BookingStatus; label: string; color: string }[] = [
  { value: 'REQUESTED', label: 'Requested', color: brand.warn },
  { value: 'CONFIRMED', label: 'Confirmed', color: brand.success },
  { value: 'COMPLETED', label: 'Completed', color: brand.info },
  { value: 'CANCELLED', label: 'Cancelled', color: brand.muted },
];

/** Appointments, across every partner. A partner sees only their own, in the portal. */
export function BookingsPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [partnerId, setPartnerId] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; booking: Booking } | null>(null);
  const [editing, setEditing] = useState<{ booking?: Booking } | null>(null);
  const [deleting, setDeleting] = useState<Booking | null>(null);

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

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['bookings'] });

  const statusMutation = useMutation({
    mutationFn: ({ booking, next }: { booking: Booking; next: BookingStatus }) =>
      api.bookings.update(booking.id, { ...toInput(booking), status: next }),
    onSuccess: (booking) => {
      toast(`Marked ${booking.status.toLowerCase()}.`);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.bookings.remove(id),
    onSuccess: () => {
      toast('Booking deleted.');
      setDeleting(null);
      void refresh();
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

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ p: 2, borderBottom: `1px solid ${brand.lineLight}` }}
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
        </Stack>

        {bookingsQuery.isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
          </Box>
        ) : bookingsQuery.isError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {errorMessage(bookingsQuery.error, 'Could not load bookings.')}
          </Alert>
        ) : bookings.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
            No bookings match these filters.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Partner</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Car</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell sx={{ fontSize: '0.875rem' }}>
                      {formatWhen(booking.scheduledAt)}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{booking.partner.name}</TableCell>
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
                      <StatusChip status={booking.status} />
                    </TableCell>
                    <TableCell align="right">
                      {(canUpdate || canDelete) && (
                        <IconButton
                          size="small"
                          aria-label="Actions"
                          onClick={(event) => setMenu({ anchor: event.currentTarget, booking })}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

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
            void refresh();
          }}
        />
      )}

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

function BookingDialog({
  booking,
  partners,
  onClose,
  onDone,
}: {
  booking?: Booking;
  partners: { id: string; name: string }[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const [draft, setDraft] = useState<BookingInput>(
    booking
      ? toInput(booking)
      : {
          partnerId: partners[0]?.id ?? '',
          carId: null,
          customerName: null,
          customerPhone: null,
          // `datetime-local` wants no timezone suffix, so trim the ISO string.
          scheduledAt: new Date().toISOString(),
          status: 'REQUESTED',
          notes: null,
        },
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      booking ? api.bookings.update(booking.id, draft) : api.bookings.create(draft),
    onSuccess: () => onDone(booking ? 'Booking saved.' : 'Booking created.'),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof BookingInput>(key: K, value: BookingInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>{booking ? 'Edit booking' : 'Add booking'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Partner"
              value={draft.partnerId}
              onChange={(event) => set('partnerId', event.target.value)}
              select
              required
              fullWidth
            >
              {partners.map((partner) => (
                <MenuItem key={partner.id} value={partner.id}>
                  {partner.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="When"
              type="datetime-local"
              value={toLocalInput(draft.scheduledAt)}
              onChange={(event) => set('scheduledAt', new Date(event.target.value).toISOString())}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Customer name"
              value={draft.customerName ?? ''}
              onChange={(event) => set('customerName', event.target.value || null)}
              fullWidth
            />
            <TextField
              label="Customer phone"
              value={draft.customerPhone ?? ''}
              onChange={(event) => set('customerPhone', event.target.value || null)}
              fullWidth
            />
            <TextField
              label="Status"
              value={draft.status}
              onChange={(event) => set('status', event.target.value as BookingStatus)}
              select
              fullWidth
            >
              {STATUSES.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notes"
              value={draft.notes ?? ''}
              onChange={(event) => set('notes', event.target.value || null)}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!draft.partnerId || mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function StatusChip({ status }: { status: BookingStatus }) {
  const tone = STATUSES.find((entry) => entry.value === status)!;
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

function toInput(booking: Booking): BookingInput {
  return {
    partnerId: booking.partnerId,
    carId: booking.carId,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    scheduledAt: booking.scheduledAt,
    status: booking.status,
    notes: booking.notes,
  };
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time, not a UTC ISO string. */
function toLocalInput(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
