import { useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { PasswordField } from '@/components/PasswordField';

/**
 * Forced step for a system-issued password — `ProtectedRoute` renders this in
 * place of everything else while `identity.mustChangePassword` is true, so a
 * partner cannot go on using the temporary password a staff member handed
 * them. `currentPassword` here is that temporary one.
 */
export function ChangePasswordPage() {
  const { api, refreshIdentity } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      // Flips `mustChangePassword` to false so ProtectedRoute lets the rest
      // of the panel through.
      await refreshIdentity();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not change your password.'));
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="You're signing in with a temporary password. Choose one only you know before continuing."
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <PasswordField
            label="Temporary password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
          />

          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required
          />

          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            error={mismatch}
            helperText={mismatch ? 'Does not match.' : undefined}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={busy || !currentPassword || !newPassword || !confirmPassword}
          >
            {busy ? 'Saving…' : 'Set password and continue'}
          </Button>

          <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', textAlign: 'center' }}>
            You won't be able to use the temporary password again after this.
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
