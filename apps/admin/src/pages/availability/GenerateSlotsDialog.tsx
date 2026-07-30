import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AvailabilityGenerateRequest, Branch } from '@autoroom/api/client';
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { WEEKDAYS, browserOffsetMinutes } from '@/pages/availability/time';

/**
 * Bulk fill — "Mon–Fri, 10:00 to 18:00, half-hour slots, for the next month".
 *
 * The times entered here are wall-clock at the browser's own offset, which is
 * sent along: "10:00" typed in Yerevan must mean 10:00 in Yerevan whatever zone
 * the API server happens to run in.
 *
 * Re-running is safe. The server skips any start time that already has a slot
 * at that branch, so adding Saturday to a week already generated adds Saturday
 * rather than a second copy of every weekday.
 */
export function GenerateSlotsDialog({
  branches,
  defaultFrom,
  defaultTo,
  onClose,
  onDone,
}: {
  branches: Branch[];
  defaultFrom: string;
  defaultTo: string;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();

  const [draft, setDraft] = useState<AvailabilityGenerateRequest>({
    branchId: null,
    from: defaultFrom,
    to: defaultTo,
    weekdays: [1, 2, 3, 4, 5],
    startTime: '10:00',
    endTime: '18:00',
    slotMinutes: 60,
    capacity: 1,
    offsetMinutes: browserOffsetMinutes(),
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.availability.generate(draft),
    onSuccess: (result) =>
      onDone(
        result.created === 0
          ? `Nothing to add — all ${result.skipped} slots were already there.`
          : `Added ${result.created} slot${result.created === 1 ? '' : 's'}` +
              (result.skipped > 0 ? `, skipped ${result.skipped} already there.` : '.'),
      ),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof AvailabilityGenerateRequest>(
    key: K,
    value: AvailabilityGenerateRequest[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const badRange = draft.to < draft.from;
  const badDay = draft.endTime <= draft.startTime;

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>Generate slots</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="From"
                type="date"
                value={draft.from}
                onChange={(event) => set('from', event.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="To"
                type="date"
                value={draft.to}
                onChange={(event) => set('to', event.target.value)}
                required
                fullWidth
                error={badRange}
                helperText={badRange ? 'Must be on or after the start date.' : ' '}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            <Stack spacing={1}>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                Days — none selected means every day in the range.
              </Typography>
              <ToggleButtonGroup
                value={draft.weekdays ?? []}
                onChange={(_event, value: number[]) => set('weekdays', value)}
                size="small"
                sx={{ flexWrap: 'wrap' }}
              >
                {WEEKDAYS.map((day) => (
                  <ToggleButton key={day.value} value={day.value} sx={{ px: 1.75 }}>
                    {day.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Opens"
                type="time"
                value={draft.startTime}
                onChange={(event) => set('startTime', event.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Closes"
                type="time"
                value={draft.endTime}
                onChange={(event) => set('endTime', event.target.value)}
                required
                fullWidth
                error={badDay}
                helperText={badDay ? 'Must be after the opening time.' : ' '}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Slot length"
                value={draft.slotMinutes}
                onChange={(event) => set('slotMinutes', Number(event.target.value))}
                select
                fullWidth
              >
                {[15, 30, 45, 60, 90, 120].map((minutes) => (
                  <MenuItem key={minutes} value={minutes}>
                    {minutes} minutes
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
              />
            </Stack>

            <TextField
              label="Branch"
              value={draft.branchId ?? ''}
              onChange={(event) => set('branchId', event.target.value || null)}
              select
              fullWidth
            >
              <MenuItem value="">No branch</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name} — {branch.city}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={badRange || badDay || mutation.isPending}
          >
            {mutation.isPending ? 'Generating…' : 'Generate'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
