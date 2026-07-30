import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AvailabilitySlot, AvailabilitySlotInput, Branch } from '@autoroom/api/client';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { toDateTimeInput } from '@/pages/availability/time';

/** Add or edit a single slot. Bulk filling is `GenerateSlotsDialog`'s job. */
export function SlotDialog({
  slot,
  branches,
  onClose,
  onDone,
}: {
  slot?: AvailabilitySlot;
  branches: Branch[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();

  const [draft, setDraft] = useState<AvailabilitySlotInput>(() =>
    slot
      ? {
          branchId: slot.branchId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          capacity: slot.capacity,
          note: slot.note,
        }
      : {
          branchId: null,
          startsAt: nextHour().toISOString(),
          endsAt: new Date(nextHour().getTime() + 30 * 60_000).toISOString(),
          capacity: 1,
          note: null,
        },
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      slot ? api.availability.update(slot.id, draft) : api.availability.create(draft),
    onSuccess: () => onDone(slot ? 'Slot saved.' : 'Slot added.'),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof AvailabilitySlotInput>(key: K, value: AvailabilitySlotInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const endsBeforeStart = new Date(draft.endsAt) <= new Date(draft.startsAt);

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>{slot ? 'Edit slot' : 'Add slot'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {slot && slot.bookedCount > 0 && (
              <Alert severity="info">
                {slot.bookedCount} booking{slot.bookedCount === 1 ? '' : 's'} hold this slot. Moving
                it moves {slot.bookedCount === 1 ? 'that appointment' : 'those appointments'} too,
                and capacity cannot go below {slot.bookedCount}.
              </Alert>
            )}

            <TextField
              label="Starts"
              type="datetime-local"
              value={toDateTimeInput(draft.startsAt)}
              onChange={(event) => set('startsAt', new Date(event.target.value).toISOString())}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Ends"
              type="datetime-local"
              value={toDateTimeInput(draft.endsAt)}
              onChange={(event) => set('endsAt', new Date(event.target.value).toISOString())}
              required
              fullWidth
              error={endsBeforeStart}
              helperText={endsBeforeStart ? 'The slot must end after it starts.' : ' '}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Branch"
              value={draft.branchId ?? ''}
              onChange={(event) => set('branchId', event.target.value || null)}
              select
              fullWidth
              helperText="Where the appointment happens."
            >
              <MenuItem value="">No branch</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name} — {branch.city}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Capacity"
              type="number"
              value={draft.capacity}
              onChange={(event) => set('capacity', Math.max(1, Number(event.target.value) || 1))}
              fullWidth
              slotProps={{ htmlInput: { min: 1, max: 50 } }}
              helperText="How many bookings this window holds."
            />
            <TextField
              label="Note"
              value={draft.note ?? ''}
              onChange={(event) => set('note', event.target.value || null)}
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
            disabled={endsBeforeStart || mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/** A sensible default that is not "right now, mid-minute". */
function nextHour(): Date {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}
