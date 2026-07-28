import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PermissionAction, PermissionPair } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { brand, mono } from '@/theme';

/**
 * The `role × resource × action` matrix, editable.
 *
 * The grid sends the whole set on save rather than deltas, matching the API:
 * two people editing at once then land on a state one of them actually chose,
 * instead of a merge neither did.
 *
 * `super_admin` is displayed but not editable. It always holds everything, and
 * letting it be narrowed here is how an instance locks itself out of role
 * management with no way back that does not involve the database.
 */
export function RolesPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const canEdit = identity?.permissions.includes('roles:UPDATE') ?? false;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: () => api.roles.list() });
  const catalogueQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.roles.catalogue(),
  });

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const activeKey = selectedKey ?? roles[0]?.key ?? null;

  const detailQuery = useQuery({
    queryKey: ['role', activeKey],
    queryFn: () => api.roles.get(activeKey!),
    enabled: Boolean(activeKey),
  });

  /** Working copy of the grid, as `resource:ACTION` keys. */
  const [granted, setGranted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (detailQuery.data) {
      setGranted(new Set(detailQuery.data.permissions.map(pairKey)));
    }
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (permissions: PermissionPair[]) =>
      api.roles.setPermissions(activeKey!, permissions),
    onSuccess: () => {
      toast('Permissions saved. They apply on the next request each user makes.');
      void queryClient.invalidateQueries({ queryKey: ['role', activeKey] });
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const detail = detailQuery.data;
  const resources = catalogueQuery.data?.resources ?? {};
  const isSuperAdmin = detail?.key === 'super_admin';
  const editable = canEdit && !isSuperAdmin;

  const saved = useMemo(
    () => new Set((detail?.permissions ?? []).map(pairKey)),
    [detail?.permissions],
  );
  const dirty = granted.size !== saved.size || [...granted].some((entry) => !saved.has(entry));

  function toggle(resource: string, action: PermissionAction) {
    const key = `${resource}:${action}`;
    setGranted((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleResource(resource: string, actions: PermissionAction[], all: boolean) {
    setGranted((current) => {
      const next = new Set(current);
      for (const action of actions) {
        const key = `${resource}:${action}`;
        if (all) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  if (rolesQuery.isPending || catalogueQuery.isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
        <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  }

  if (rolesQuery.isError || catalogueQuery.isError) {
    return (
      <Alert severity="error">
        {errorMessage(rolesQuery.error ?? catalogueQuery.error, 'Could not load roles.')}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Roles
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        What each role may do. Changes take effect on the next request — nobody has to sign in
        again.
      </Typography>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        sx={{ alignItems: 'flex-start' }}
      >
        <Paper
          variant="outlined"
          sx={{ borderRadius: 3, p: 1, width: { xs: '100%', md: 268 }, flex: 'none' }}
        >
          {roles.map((role) => {
            const selected = role.key === activeKey;
            return (
              <Box
                key={role.key}
                component="button"
                type="button"
                onClick={() => setSelectedKey(role.key)}
                aria-current={selected}
                sx={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 2,
                  px: 1.75,
                  py: 1.5,
                  bgcolor: selected ? `${brand.ink}0D` : 'transparent',
                  '&:hover': { bgcolor: `${brand.ink}0A` },
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', fontWeight: selected ? 600 : 500 }}>
                  {role.name}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {role.userCount} {role.userCount === 1 ? 'user' : 'users'} ·{' '}
                  {role.permissionCount} permissions
                </Typography>
              </Box>
            );
          })}
        </Paper>

        <Paper
          variant="outlined"
          sx={{ borderRadius: 3, flex: 1, minWidth: 0, overflow: 'hidden' }}
        >
          {detailQuery.isPending || !detail ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
              <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
            </Box>
          ) : (
            <>
              <Box sx={{ p: { xs: 2.5, md: 3 }, borderBottom: `1px solid ${brand.lineLight}` }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="h5">{detail.name}</Typography>
                      <Chip
                        label={detail.key}
                        size="small"
                        sx={{ height: 20, fontFamily: mono, fontSize: '0.6875rem' }}
                      />
                    </Stack>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      {detail.description ?? 'No description.'}
                    </Typography>
                  </Box>

                  {editable && (
                    <Button
                      variant="contained"
                      disabled={!dirty || saveMutation.isPending}
                      onClick={() => saveMutation.mutate([...granted].map(parseKey))}
                      sx={{ flex: 'none' }}
                    >
                      {saveMutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                  )}
                </Stack>

                {isSuperAdmin && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Super admin always holds every permission and cannot be narrowed. Create a
                    separate role if you need a smaller set.
                  </Alert>
                )}
                {!canEdit && !isSuperAdmin && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Your role can view this matrix but not change it.
                  </Alert>
                )}
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 620 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Resource</TableCell>
                      {ACTION_COLUMNS.map((action) => (
                        <TableCell key={action} align="center" sx={{ width: 92 }}>
                          {action.toLowerCase()}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(resources).map(([resource, actions]) => {
                      const all = actions.every((action) => granted.has(`${resource}:${action}`));
                      return (
                        <TableRow key={resource} hover>
                          <TableCell>
                            <Box
                              component={editable ? 'button' : 'span'}
                              type={editable ? 'button' : undefined}
                              onClick={
                                editable ? () => toggleResource(resource, actions, all) : undefined
                              }
                              sx={{
                                fontFamily: mono,
                                fontSize: '0.8125rem',
                                border: 'none',
                                bgcolor: 'transparent',
                                p: 0,
                                cursor: editable ? 'pointer' : 'default',
                                color: 'inherit',
                                textDecoration: editable ? 'underline dotted' : 'none',
                                textUnderlineOffset: 4,
                              }}
                              title={editable ? 'Toggle every action on this resource' : undefined}
                            >
                              {resource}
                            </Box>
                          </TableCell>
                          {ACTION_COLUMNS.map((action) => {
                            const applicable = actions.includes(action);
                            return (
                              <TableCell key={action} align="center">
                                {applicable ? (
                                  <Checkbox
                                    size="small"
                                    checked={isSuperAdmin || granted.has(`${resource}:${action}`)}
                                    disabled={!editable}
                                    onChange={() => toggle(resource, action)}
                                    inputProps={{
                                      'aria-label': `${action.toLowerCase()} ${resource}`,
                                    }}
                                  />
                                ) : (
                                  <Box
                                    aria-hidden
                                    sx={{ color: brand.lineLight, fontSize: '0.75rem' }}
                                  >
                                    —
                                  </Box>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}

const ACTION_COLUMNS: PermissionAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PUBLISH'];

const pairKey = (pair: PermissionPair) => `${pair.resource}:${pair.action}`;

function parseKey(key: string): PermissionPair {
  const [resource, action] = key.split(':');
  return { resource: resource!, action: action as PermissionAction };
}
