import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MIN_PASSWORD_LENGTH } from '@autoroom/api/client';
import type { AdminUser, RoleSummary } from '@autoroom/api/client';
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
import { PasswordField } from '@/components/PasswordField';

export type UserFormMode = 'create' | 'edit';

/**
 * Create an account, or edit an existing one's name and email.
 *
 * Role and password are create-time fields only. Changing either on an existing
 * account is a distinct, more consequential act — one re-scopes what they can
 * reach, the other logs them out of every session — so both live behind their
 * own explicit menu entries rather than riding along in a general edit form
 * where they could be changed by accident.
 */
export function UserFormDialog({
  mode,
  user,
  roles,
  onClose,
  onDone,
}: {
  mode: UserFormMode;
  user?: AdminUser;
  roles: RoleSummary[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [roleKey, setRoleKey] = useState(user?.role?.key ?? '');
  const [error, setError] = useState<string | null>(null);

  const creating = mode === 'create';

  const mutation = useMutation({
    mutationFn: async () => {
      if (creating) {
        const created = await api.users.create({ email, name, password, roleKey });
        return `${created.name} can now sign in.`;
      }
      const changes = {
        ...(name !== user?.name ? { name } : {}),
        ...(email !== user?.email ? { email } : {}),
      };
      if (Object.keys(changes).length === 0) return 'Nothing to change.';
      const updated = await api.users.update(user!.id, changes);
      return `${updated.name} updated.`;
    },
    onSuccess: onDone,
    onError: (caught) => setError(errorMessage(caught)),
  });

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const complete = creating
    ? name && email && roleKey && password.length >= MIN_PASSWORD_LENGTH
    : Boolean(name && email);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{creating ? 'Add user' : 'Edit user'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
            />

            {creating && (
              <>
                <TextField
                  label="Role"
                  value={roleKey}
                  onChange={(event) => setRoleKey(event.target.value)}
                  select
                  required
                  fullWidth
                  helperText={roles.length === 0 ? 'No roles available.' : undefined}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.key} value={role.key}>
                      {role.name}
                    </MenuItem>
                  ))}
                </TextField>

                <PasswordField
                  label="Temporary password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  required
                  error={passwordTooShort}
                  helperText={
                    passwordTooShort
                      ? `At least ${MIN_PASSWORD_LENGTH} characters.`
                      : 'Share it with them directly — no email is sent.'
                  }
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!complete || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : creating ? 'Create user' : 'Save changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
