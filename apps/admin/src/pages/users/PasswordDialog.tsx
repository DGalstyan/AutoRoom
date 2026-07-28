import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MIN_PASSWORD_LENGTH } from '@autoroom/api/client';
import type { AdminUser } from '@autoroom/api/client';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { PasswordField } from '@/components/PasswordField';

/**
 * Set someone's password on their behalf.
 *
 * This is the panel's only account-recovery path — there is no self-serve
 * reset — so the copy is explicit that it signs them out everywhere and that
 * the new password has to be delivered by hand.
 */
export function PasswordDialog({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api, identity, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isSelf = user.id === identity?.userId;

  const mutation = useMutation({
    mutationFn: () => api.users.setPassword(user.id, password),
    onSuccess: () => {
      onDone(`Password set for ${user.name}. Their existing sessions were signed out.`);
      // Changing your own password revokes your own sessions too — the token in
      // memory still works until it expires, which would be a confusing few
      // minutes of half-valid access. End it cleanly instead.
      if (isSelf) void signOut();
    },
    onError: (caught) => setError(errorMessage(caught)),
  });

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const ready = password.length >= MIN_PASSWORD_LENGTH && confirmation === password;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Set password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem', mb: 3 }}>
            {isSelf
              ? 'You will be signed out and will need to sign back in with the new password.'
              : `${user.name} will be signed out everywhere. Give them the new password directly — no email is sent.`}
          </DialogContentText>

          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <PasswordField
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              required
              error={tooShort}
              helperText={tooShort ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
            />

            <PasswordField
              label="Confirm password"
              value={confirmation}
              onChange={setConfirmation}
              autoComplete="new-password"
              required
              error={mismatch}
              helperText={mismatch ? 'Passwords do not match.' : undefined}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!ready || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Set password'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
