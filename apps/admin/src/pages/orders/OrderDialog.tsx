import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Car } from '@autoroom/api/client';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage, extractFieldErrors } from '@/lib/api';

/**
 * Starts a new order for a car that doesn't have one yet. Create-only — an
 * order's car can't be changed once set (the wrong car means delete and
 * recreate, same as everywhere else in this panel that treats a mis-picked
 * parent record as a mistake to start over on, not edit around).
 */
export function OrderDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (orderId: string) => void;
}) {
  const { api } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const carsQuery = useQuery({
    queryKey: ['cars', 'order-picker'],
    queryFn: () => api.cars.list({ take: 100, sort: 'createdAt', direction: 'desc' }),
  });
  const cars = carsQuery.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: () => api.orders.create({ carId: car!.id, orderNumber: orderNumber.trim() }),
    onSuccess: (order) => onDone(order.id),
    onError: (caught) => {
      setFieldErrors(extractFieldErrors(caught));
      setError(errorMessage(caught));
    },
  });

  const canSubmit = Boolean(car) && orderNumber.trim().length > 0;

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setFieldErrors({});
          mutation.mutate();
        }}
      >
        <DialogTitle>New order</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Autocomplete
              options={cars}
              value={car}
              loading={carsQuery.isFetching}
              getOptionLabel={(candidate) =>
                `${candidate.make} ${candidate.model} (${candidate.year})${candidate.vin ? ` · ${candidate.vin}` : ''}`
              }
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_event, selected) => setCar(selected)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Car"
                  required
                  placeholder="Search by make or model…"
                  error={Boolean(fieldErrors.carId)}
                  helperText={
                    fieldErrors.carId ?? 'Only cars without an existing order can be picked.'
                  }
                />
              )}
            />

            <TextField
              label="Order number"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              required
              fullWidth
              error={Boolean(fieldErrors.orderNumber)}
              helperText={
                fieldErrors.orderNumber ?? "AutoRoom's own reference, shown to the partner."
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
