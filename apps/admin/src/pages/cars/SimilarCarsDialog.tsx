import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Car, CarSummary } from '@autoroom/api/client';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage, extractFieldErrors } from '@/lib/api';
import { toCarInput } from '@/pages/cars/carOptions';

/**
 * Curate one car's "Նմանատիպ առաջարկներ" pick list from the cars list —
 * the same field `CarFormPage`'s "Similar cars" section edits, just reachable
 * without opening the full edit form. `update` takes the whole record (there
 * is no dedicated similar-cars endpoint the way `setPartner` has one for
 * partners), so this sends the car back through `toCarInput` with only
 * `similarCarIds` changed.
 */
export function SimilarCarsDialog({
  car,
  onClose,
  onDone,
}: {
  car: Car;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const [selected, setSelected] = useState<CarSummary[]>(car.similarCars);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Scoped to the car's own origin — a China car being "similar to" a USA
  // one isn't a comparison the public detail page's own automatic fallback
  // ever makes either.
  const candidatesQuery = useQuery({
    queryKey: ['cars', 'similar-candidates', car.origin],
    queryFn: () => api.cars.list({ origin: car.origin, take: 100 }),
  });
  const candidates = (candidatesQuery.data?.items ?? []).filter(
    (candidate) => candidate.id !== car.id,
  );
  // The candidate query is capped at 100 — a car already curated before it
  // fell outside that cap still needs to render a real label, not a bare id.
  const optionsById = new Map<string, CarSummary>();
  for (const candidate of candidates) optionsById.set(candidate.id, candidate);
  for (const candidate of car.similarCars) {
    if (!optionsById.has(candidate.id)) optionsById.set(candidate.id, candidate);
  }
  const options = Array.from(optionsById.values());

  const mutation = useMutation({
    mutationFn: () =>
      api.cars.update(car.id, {
        ...toCarInput(car),
        similarCarIds: selected.map((candidate) => candidate.id),
      }),
    onSuccess: (updated) =>
      onDone(
        updated.similarCars.length > 0
          ? `${updated.make} ${updated.model}: ${updated.similarCars.length} similar car(s) saved.`
          : `${updated.make} ${updated.model}: similar cars cleared.`,
      ),
    onError: (caught) => {
      const fields = extractFieldErrors(caught);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(errorMessage(caught));
    },
  });

  const unchanged =
    selected.length === car.similarCars.length &&
    selected.every((candidate, index) => candidate.id === car.similarCars[index]?.id);

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(null);
          setFieldErrors({});
          mutation.mutate();
        }}
      >
        <DialogTitle>Similar cars</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Shown as “Նմանատիպ առաջարկներ” on {car.make} {car.model} {car.year}
              ’s detail page. Leave empty to fall back to the automatic same-powertrain,
              closest-price match.
            </Typography>

            <Autocomplete
              multiple
              options={options}
              value={selected}
              loading={candidatesQuery.isFetching}
              getOptionLabel={(candidate) =>
                `${candidate.make} ${candidate.model} (${candidate.year})`
              }
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_event, next) => setSelected(next)}
              renderTags={(value, getTagProps) =>
                value.map((candidate, index) => (
                  <Chip
                    label={`${candidate.make} ${candidate.model}`}
                    size="small"
                    {...getTagProps({ index })}
                    key={candidate.id}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={selected.length === 0 ? 'Search by make or model…' : undefined}
                  helperText={
                    fieldErrors.similarCarIds ?? `${selected.length}/8 selected, in order`
                  }
                  error={Boolean(fieldErrors.similarCarIds)}
                  autoFocus
                />
              )}
            />
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
