import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUser, RoleSummary, UserStatus } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UserFormDialog, type UserFormMode } from '@/pages/users/UserFormDialog';
import { PasswordDialog } from '@/pages/users/PasswordDialog';
import { brand, mono } from '@/theme';

type StatusFilter = UserStatus | 'ALL';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Disabled', value: 'DISABLED' },
];

/**
 * Every account in the system, and the actions that change one.
 *
 * The row menu is filtered twice: once by what the *account* allows (you cannot
 * approve an account that is already active, or disable yourself), and once by
 * what the *viewer* holds. The API enforces the same rules, so nothing here is
 * a security boundary — it exists so nobody is offered a button that will only
 * ever answer 403.
 */
export function UsersPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; user: AdminUser } | null>(null);
  const [form, setForm] = useState<{ mode: UserFormMode; user?: AdminUser } | null>(null);
  const [passwordFor, setPasswordFor] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const canCreate = identity?.permissions.includes('users:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('users:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('users:DELETE') ?? false;
  const canReadRoles = identity?.permissions.includes('roles:READ') ?? false;

  const usersQuery = useQuery({
    queryKey: ['users', statusFilter],
    queryFn: () =>
      api.users.list(statusFilter === 'ALL' ? { take: 100 } : { status: statusFilter, take: 100 }),
  });

  /**
   * Roles drive every assignment control. Gated on `roles:READ` because a role
   * without it would otherwise fire a request that can only 403.
   */
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.roles.list(),
    enabled: canReadRoles,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      api.users.setStatus(id, status),
    onSuccess: (user) => {
      toast(`${user.name} is now ${user.status.toLowerCase()}.`);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, roleKey, pending }: { id: string; roleKey: string; pending: boolean }) =>
      pending ? api.users.approve(id, roleKey) : api.users.assignRole(id, roleKey),
    onSuccess: (user) => {
      toast(`${user.name} is now ${user.role?.name ?? 'unassigned'}.`);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.users.remove(id),
    onSuccess: () => {
      toast(`${deleting?.name ?? 'Account'} deleted.`);
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const roles: RoleSummary[] = rolesQuery.data ?? [];
  const users = usersQuery.data?.items ?? [];

  function closeMenu() {
    setMenu(null);
  }

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Users
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Everyone who can sign in, and what each of them may do.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setForm({ mode: 'create' })}
            sx={{ flex: 'none' }}
          >
            Add user
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={statusFilter}
          onChange={(_event, value: StatusFilter) => setStatusFilter(value)}
          sx={{ px: 2, borderBottom: `1px solid ${brand.lineLight}` }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>

        {usersQuery.isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
          </Box>
        ) : usersQuery.isError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {errorMessage(usersQuery.error, 'Could not load users.')}
          </Alert>
        ) : users.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
            No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} accounts.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last sign-in</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === identity?.userId;
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {user.name}
                          {isSelf && (
                            <Typography
                              component="span"
                              sx={{ color: 'text.secondary', fontWeight: 400, ml: 0.75 }}
                            >
                              (you)
                            </Typography>
                          )}
                        </Typography>
                        <Typography
                          sx={{ fontFamily: mono, fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem' }}>
                          {user.role?.name ?? (
                            <Box component="span" sx={{ color: 'text.secondary' }}>
                              Not assigned
                            </Box>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={user.status} />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                        {formatDate(user.lastLoginAt) ?? 'Never'}
                      </TableCell>
                      <TableCell align="right">
                        {(canUpdate || canDelete) && (
                          <IconButton
                            size="small"
                            aria-label={`Actions for ${user.name}`}
                            onClick={(event) => setMenu({ anchor: event.currentTarget, user })}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {!canReadRoles && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Your role cannot read the role catalogue, so role assignment is unavailable.
        </Alert>
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={closeMenu}>
        {canUpdate && (
          <MenuItem
            onClick={() => {
              if (menu) setForm({ mode: 'edit', user: menu.user });
              closeMenu();
            }}
          >
            Edit details
          </MenuItem>
        )}
        {canUpdate && (
          <MenuItem
            onClick={() => {
              setPasswordFor(menu?.user ?? null);
              closeMenu();
            }}
          >
            Set password
          </MenuItem>
        )}

        {canUpdate && canReadRoles && roles.length > 0 && <Divider />}
        {canUpdate &&
          canReadRoles &&
          roles.map((role) => {
            const current = menu?.user.role?.key === role.key;
            return (
              <MenuItem
                key={role.key}
                selected={current}
                disabled={current || roleMutation.isPending}
                onClick={() => {
                  if (menu) {
                    roleMutation.mutate({
                      id: menu.user.id,
                      roleKey: role.key,
                      pending: menu.user.status === 'PENDING',
                    });
                  }
                  closeMenu();
                }}
                sx={{ fontSize: '0.875rem' }}
              >
                {menu?.user.status === 'PENDING' ? `Approve as ${role.name}` : `Make ${role.name}`}
              </MenuItem>
            );
          })}

        {canUpdate && menu?.user.status !== 'PENDING' && <Divider />}
        {canUpdate && menu && menu.user.status !== 'PENDING' && (
          <MenuItem
            disabled={menu.user.id === identity?.userId || statusMutation.isPending}
            onClick={() => {
              statusMutation.mutate({
                id: menu.user.id,
                status: menu.user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
              });
              closeMenu();
            }}
          >
            {menu.user.status === 'ACTIVE' ? 'Disable account' : 'Enable account'}
          </MenuItem>
        )}

        {canDelete && menu && (
          <MenuItem
            disabled={menu.user.id === identity?.userId}
            onClick={() => {
              setDeleting(menu.user);
              closeMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            Delete account
          </MenuItem>
        )}
      </Menu>

      {form && (
        <UserFormDialog
          mode={form.mode}
          user={form.user}
          roles={roles}
          onClose={() => setForm(null)}
          onDone={(message) => {
            setForm(null);
            toast(message);
            void refresh();
          }}
        />
      )}

      {passwordFor && (
        <PasswordDialog
          user={passwordFor}
          onClose={() => setPasswordFor(null)}
          onDone={(message) => {
            setPasswordFor(null);
            toast(message);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this account?"
        message={
          deleting
            ? `${deleting.name} (${deleting.email}) will be removed and signed out everywhere. This cannot be undone. Their audit history is kept.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}

function StatusChip({ status }: { status: UserStatus }) {
  // Colour alone never carries the meaning — the label always says it too.
  const tone = {
    ACTIVE: { color: brand.success, label: 'Active' },
    PENDING: { color: brand.warn, label: 'Pending' },
    DISABLED: { color: brand.muted, label: 'Disabled' },
  }[status];

  return (
    <Chip
      label={tone.label}
      size="small"
      sx={{
        height: 22,
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: tone.color,
        bgcolor: `${tone.color}18`,
      }}
    />
  );
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
