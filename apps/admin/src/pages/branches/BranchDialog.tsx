import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Branch, BranchInput } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { UploadField } from '@/components/UploadField';

/**
 * Add or edit a branch.
 *
 * Grouped the way the public surface reads it: first what the popup shows
 * (photo, address, phone, hours), then what places the pin. The coordinates sit
 * behind a note rather than a map picker — a picker is the right answer
 * eventually, but a pair of number fields that works today beats a map widget
 * that is not written yet, and the values are a right-click away in Google Maps.
 */
export function BranchDialog({
  branch,
  nextPosition,
  onClose,
  onDone,
}: {
  branch?: Branch;
  nextPosition: number;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();

  const [draft, setDraft] = useState<BranchInput>(() =>
    branch
      ? {
          name: branch.name,
          city: branch.city,
          address: branch.address,
          phone: branch.phone,
          hours: branch.hours,
          lat: branch.lat,
          lng: branch.lng,
          mapUrl: branch.mapUrl,
          photoUrl: branch.photoUrl,
          position: branch.position,
        }
      : {
          name: '',
          city: '',
          address: '',
          phone: '',
          // Every branch keeps these hours today; pre-filling saves retyping
          // the one value that has never differed.
          hours: '10:00–22:00',
          lat: null,
          lng: null,
          mapUrl: null,
          photoUrl: null,
          position: nextPosition,
        },
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => (branch ? api.branches.update(branch.id, draft) : api.branches.create(draft)),
    onSuccess: () => onDone(branch ? 'Branch saved.' : 'Branch added.'),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof BranchInput>(key: K, value: BranchInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  /** Empty is allowed — a branch without a pin is a real, if incomplete, state. */
  function setCoordinate(key: 'lat' | 'lng', raw: string) {
    set(key, raw.trim() === '' ? null : Number(raw));
  }

  const incomplete =
    !draft.name.trim() ||
    !draft.city.trim() ||
    !draft.address.trim() ||
    !draft.phone.trim() ||
    !draft.hours.trim();

  // One coordinate without the other places nothing, and is more likely a
  // half-finished paste than an intention.
  const halfPinned = (draft.lat === null) !== (draft.lng === null);

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>{branch ? 'Edit branch' : 'Add branch'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Name"
                value={draft.name}
                onChange={(event) => set('name', event.target.value)}
                required
                fullWidth
                helperText="e.g. Մասնաճյուղ N4"
              />
              <TextField
                label="City"
                value={draft.city}
                onChange={(event) => set('city', event.target.value)}
                required
                fullWidth
                helperText="Labels the pin, e.g. Արմավիր"
              />
            </Stack>

            <TextField
              label="Address"
              value={draft.address}
              onChange={(event) => set('address', event.target.value)}
              required
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Phone"
                value={draft.phone}
                onChange={(event) => set('phone', event.target.value)}
                required
                fullWidth
                helperText="Rendered as click-to-call."
              />
              <TextField
                label="Opening hours"
                value={draft.hours}
                onChange={(event) => set('hours', event.target.value)}
                required
                fullWidth
              />
            </Stack>

            <UploadField
              label="Photo"
              accept="image/*"
              value={draft.photoUrl ?? null}
              onChange={(url) => set('photoUrl', url)}
              helperText="Shown at the top of the branch popup."
              disabled={mutation.isPending}
              preview={(url) => (
                <Box
                  component="img"
                  src={url}
                  alt=""
                  sx={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
                />
              )}
            />

            <Divider />
            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
              Where the pin sits. In Google Maps, right-click the spot and copy the pair — latitude
              first. Without both, the branch is listed but never drawn on the map.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Latitude"
                value={draft.lat ?? ''}
                onChange={(event) => setCoordinate('lat', event.target.value)}
                type="number"
                fullWidth
                error={halfPinned && draft.lat === null}
                slotProps={{ htmlInput: { step: 'any', min: -90, max: 90 } }}
              />
              <TextField
                label="Longitude"
                value={draft.lng ?? ''}
                onChange={(event) => setCoordinate('lng', event.target.value)}
                type="number"
                fullWidth
                error={halfPinned && draft.lng === null}
                slotProps={{ htmlInput: { step: 'any', min: -180, max: 180 } }}
              />
            </Stack>
            {halfPinned && (
              <Alert severity="warning">
                Both coordinates are needed to place the pin. Fill the other one, or clear both.
              </Alert>
            )}

            <TextField
              label="Directions link"
              value={draft.mapUrl ?? ''}
              onChange={(event) => set('mapUrl', event.target.value || null)}
              fullWidth
              helperText="Backs the Ուղղություն button. A Google Maps share link is fine."
            />

            <TextField
              label="Position"
              type="number"
              value={draft.position}
              onChange={(event) => set('position', Math.max(0, Number(event.target.value) || 0))}
              sx={{ width: 140 }}
              slotProps={{ htmlInput: { min: 0, max: 999 } }}
              helperText="Lower shows first."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={incomplete || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
