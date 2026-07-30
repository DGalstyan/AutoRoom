import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Booking, BookingInput, BookingStatus } from '@autoroom/api/client';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { STATUSES } from '@/pages/bookings/status';
import { formatDateTime, formatTime, toDateTimeInput } from '@/pages/availability/time';

type TimeMode = 'slot' | 'custom';

/**
 * Add or edit an appointment.
 *
 * The two ways of setting a time are separate modes rather than two fields that
 * quietly override each other: booking *into the diary* is the normal path and
 * the one that reserves capacity, while a free time is the deliberate exception
 * for something arranged outside it. Making that a visible choice is what stops
 * a slot being picked and then silently ignored.
 */
export function BookingDialog({
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
  const { api, identity } = useAuth();
  const canReadAvailability = identity?.permissions.includes('availability:READ') ?? false;

  const [mode, setMode] = useState<TimeMode>(() =>
    booking ? (booking.slotId ? 'slot' : 'custom') : canReadAvailability ? 'slot' : 'custom',
  );
  const [draft, setDraft] = useState<BookingInput>(() =>
    booking
      ? toInput(booking)
      : {
          partnerId: partners[0]?.id ?? '',
          carId: null,
          slotId: null,
          customerName: null,
          customerPhone: null,
          scheduledAt: new Date().toISOString(),
          status: 'REQUESTED',
          notes: null,
        },
  );
  const [error, setError] = useState<string | null>(null);

  const slotsQuery = useQuery({
    queryKey: ['availability', 'picker'],
    queryFn: () =>
      api.availability.list({
        from: new Date().toISOString(),
        to: new Date(Date.now() + 60 * 86_400_000).toISOString(),
        take: 500,
      }),
    enabled: canReadAvailability,
  });

  /**
   * Open slots, plus whichever one this booking already holds. Without that
   * second part, editing a capacity-1 booking would find its own slot missing
   * from the list — it is full, and it is full *because of this booking*.
   */
  const slots = useMemo(() => {
    const all = slotsQuery.data?.items ?? [];
    return all.filter((slot) => slot.open || slot.id === booking?.slotId);
  }, [slotsQuery.data, booking?.slotId]);

  const mutation = useMutation({
    mutationFn: () => {
      const body: BookingInput =
        mode === 'slot'
          ? { ...draft, slotId: draft.slotId, scheduledAt: undefined }
          : { ...draft, slotId: null };
      return booking ? api.bookings.update(booking.id, body) : api.bookings.create(body);
    },
    onSuccess: () => onDone(booking ? 'Booking saved.' : 'Booking created.'),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof BookingInput>(key: K, value: BookingInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const missingTime = mode === 'slot' ? !draft.slotId : !draft.scheduledAt;

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

            {canReadAvailability && (
              <Tabs
                value={mode}
                onChange={(_event, value: TimeMode) => setMode(value)}
                variant="fullWidth"
                sx={{ minHeight: 38 }}
              >
                <Tab label="From availability" value="slot" sx={{ minHeight: 38 }} />
                <Tab label="Specific time" value="custom" sx={{ minHeight: 38 }} />
              </Tabs>
            )}

            {mode === 'slot' ? (
              slotsQuery.isPending ? (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  Loading slots…
                </Typography>
              ) : slots.length === 0 ? (
                <Alert severity="info">
                  No open slots in the next 60 days. Add availability, or use a specific time.
                </Alert>
              ) : (
                <TextField
                  label="Slot"
                  value={draft.slotId ?? ''}
                  onChange={(event) => set('slotId', event.target.value || null)}
                  select
                  required
                  fullWidth
                  helperText="Only open slots are listed. The appointment takes the slot's time."
                >
                  {slots.map((slot) => (
                    <MenuItem key={slot.id} value={slot.id}>
                      {formatDateTime(slot.startsAt)}–{formatTime(slot.endsAt)}
                      {slot.branch ? ` · ${slot.branch.name}` : ''}
                      {slot.capacity > 1 ? ` · ${slot.bookedCount}/${slot.capacity}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              )
            ) : (
              <TextField
                label="When"
                type="datetime-local"
                value={toDateTimeInput(draft.scheduledAt ?? new Date().toISOString())}
                onChange={(event) => set('scheduledAt', new Date(event.target.value).toISOString())}
                required
                fullWidth
                helperText="Books outside the published diary — no slot is reserved."
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}

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
            disabled={!draft.partnerId || missingTime || mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function toInput(booking: Booking): BookingInput {
  return {
    partnerId: booking.partnerId,
    carId: booking.carId,
    slotId: booking.slotId,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    scheduledAt: booking.scheduledAt,
    status: booking.status,
    notes: booking.notes,
  };
}
