import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { PasswordField } from '@/components/PasswordField';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      // Return the person to whatever they were trying to open.
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught, 'Could not sign you in.'));
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Manage cars, leads and orders.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            autoFocus
            required
            fullWidth
          />

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={busy || !email || !password}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>

          {/* No "request access" link by design — accounts are created by a
              super admin inside the panel, never from the public login page. */}
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', textAlign: 'center' }}>
            Staff access only. Ask a super admin for an account.
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
