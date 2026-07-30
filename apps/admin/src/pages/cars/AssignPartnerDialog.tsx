import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Car, Partner } from '@autoroom/api/client';
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
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';

/**
 * Assign a car to a partner, move it to a different one, or detach it.
 *
 * All three are the same write — a car points at one partner or at none — so
 * they are one dialog rather than three menu entries. Reassigning needs nothing
 * done to the partner losing the car: the relation lives on the car, and a
 * partner simply holds however many cars point at them.
 */
export function AssignPartnerDialog({
  car,
  partners,
  onClose,
  onDone,
}: {
  car: Car;
  partners: Partner[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const [partnerId, setPartnerId] = useState(car.partnerId ?? '');
  const [error, setError] = useState<string | null>(null);

  const current = car.partner ?? partners.find((partner) => partner.id === car.partnerId) ?? null;

  const mutation = useMutation({
    mutationFn: () => api.cars.setPartner(car.id, partnerId || null),
    onSuccess: (updated) => {
      const next = partners.find((partner) => partner.id === updated.partnerId);
      onDone(
        next
          ? `${updated.make} ${updated.model} assigned to ${next.name}.`
          : `${updated.make} ${updated.model} is no longer assigned to a partner.`,
      );
    },
    onError: (caught) => setError(errorMessage(caught)),
  });

  const unchanged = (partnerId || null) === (car.partnerId ?? null);

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>{current ? 'Reassign car' : 'Assign to partner'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              {car.make} {car.model} {car.year}
              {current ? ` is currently with ${current.name}.` : ' is not assigned to anyone.'}
            </Typography>

            <TextField
              label="Partner"
              value={partnerId}
              onChange={(event) => setPartnerId(event.target.value)}
              select
              fullWidth
              helperText="They will see this car in their portal. Choose “No partner” to detach it."
            >
              <MenuItem value="">No partner</MenuItem>
              {partners.map((partner) => (
                <MenuItem key={partner.id} value={partner.id}>
                  {partner.name}
                  {partner.company ? ` — ${partner.company}` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={unchanged || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
