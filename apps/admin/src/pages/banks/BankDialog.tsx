import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Bank, BankInput } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { UploadField } from '@/components/UploadField';

/**
 * Add or edit a partner bank in the China/USA financing grid.
 *
 * `inHouse` is the one field that changes what the row does on the public
 * site: an in-house row has no loan link to open, so the CTA opens the
 * financing detail popup instead of a bank's own site. Clearing the loan URL
 * on an in-house row is expected, not an error.
 */
export function BankDialog({
  bank,
  nextPosition,
  onClose,
  onDone,
}: {
  bank?: Bank;
  nextPosition: number;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();

  const [draft, setDraft] = useState<BankInput>(() =>
    bank
      ? {
          name: bank.name,
          logoUrl: bank.logoUrl,
          loanUrl: bank.loanUrl,
          inHouse: bank.inHouse,
          position: bank.position,
        }
      : {
          name: '',
          logoUrl: null,
          loanUrl: null,
          inHouse: false,
          position: nextPosition,
        },
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => (bank ? api.banks.update(bank.id, draft) : api.banks.create(draft)),
    onSuccess: () => onDone(bank ? 'Bank saved.' : 'Bank added.'),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof BankInput>(key: K, value: BankInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const incomplete = !draft.name.trim();

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>{bank ? 'Edit bank' : 'Add bank'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Name"
              value={draft.name}
              onChange={(event) => set('name', event.target.value)}
              required
              fullWidth
              helperText="e.g. Ameriabank"
            />

            <UploadField
              label="Logo"
              accept="image/*"
              value={draft.logoUrl ?? null}
              onChange={(url) => set('logoUrl', url)}
              helperText="Shown in the financing bank grid. Transparent PNG or SVG looks best."
              disabled={mutation.isPending}
              preview={(url) => (
                <Box
                  component="img"
                  src={url}
                  alt=""
                  sx={{
                    width: '100%',
                    maxHeight: 120,
                    objectFit: 'contain',
                    display: 'block',
                    bgcolor: 'grey.100',
                  }}
                />
              )}
            />

            <TextField
              label="Loan page URL"
              value={draft.loanUrl ?? ''}
              onChange={(event) => set('loanUrl', event.target.value || null)}
              fullWidth
              disabled={draft.inHouse}
              helperText={
                draft.inHouse
                  ? 'In-house rows open the financing popup instead — no link needed.'
                  : "Opens in a new tab. The bank's own auto-loan page."
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={draft.inHouse}
                  onChange={(event) => set('inHouse', event.target.checked)}
                />
              }
              label="In-house financing offer (AutoRoom's own, not a bank)"
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
