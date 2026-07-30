import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Branch } from '@autoroom/api/client';
import { Alert, Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { BranchDialog } from '@/pages/branches/BranchDialog';
import { brand, mono } from '@/theme';

/**
 * Branches — the pins behind Homepage Section 8, `Մեր մասնաճյուղերը`.
 *
 * Everything the map's popup shows is editable here: photo, address, phone and
 * opening hours, plus the coordinates that place the pin. That is the point of
 * the screen — `references/branches.md` records a fourth pin (a second Armavir
 * point) whose address was never confirmed, and it should be addable by whoever
 * confirms it rather than by a developer.
 */
export function BranchesPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [menu, setMenu] = useState<{ anchor: HTMLElement; branch: Branch } | null>(null);
  const [editing, setEditing] = useState<{ branch?: Branch } | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);

  const canCreate = identity?.permissions.includes('branches:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('branches:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('branches:DELETE') ?? false;

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.branches.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['branches'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.branches.remove(id),
    onSuccess: () => {
      toast('Branch removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const branches = branchesQuery.data?.items ?? [];
  const unmapped = branches.filter((branch) => branch.lat === null || branch.lng === null).length;

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Branches
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            The pins on the homepage map, and what each one’s popup shows.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add branch
          </Button>
        )}
      </Stack>

      {/* Coordinates are the one field whose absence is invisible on this
          screen but fatal on the map — the branch simply would not appear. */}
      {unmapped > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {unmapped === 1
            ? 'One branch has no coordinates, so it cannot be placed on the map.'
            : `${unmapped} branches have no coordinates, so they cannot be placed on the map.`}
        </Alert>
      )}

      <DataTable
        rows={branches}
        getRowId={(branch) => branch.id}
        isPending={branchesQuery.isPending}
        error={branchesQuery.isError ? branchesQuery.error : undefined}
        errorMessage="Could not load branches."
        emptyMessage="No branches yet."
        minWidth={900}
        columns={[
          {
            key: 'photo',
            width: 76,
            render: (branch) => (
              <Box
                sx={{
                  width: 56,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: brand.surfaceLight,
                  border: `1px solid ${brand.lineLight}`,
                  overflow: 'hidden',
                }}
              >
                {branch.photoUrl && (
                  <Box
                    component="img"
                    src={branch.photoUrl}
                    alt=""
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </Box>
            ),
          },
          {
            key: 'branch',
            header: 'Branch',
            render: (branch) => (
              <>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {branch.name}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {branch.city}
                </Typography>
              </>
            ),
          },
          {
            key: 'address',
            header: 'Address',
            render: (branch) => (
              <Typography sx={{ fontSize: '0.875rem' }}>{branch.address}</Typography>
            ),
          },
          {
            key: 'phone',
            header: 'Phone',
            render: (branch) => (
              <Typography sx={{ fontFamily: mono, fontSize: '0.8125rem' }}>
                {branch.phone}
              </Typography>
            ),
          },
          {
            key: 'hours',
            header: 'Hours',
            render: (branch) => (
              <Typography sx={{ fontSize: '0.875rem' }}>{branch.hours}</Typography>
            ),
          },
          {
            key: 'map',
            header: 'Map',
            render: (branch) =>
              branch.lat !== null && branch.lng !== null ? (
                <StatusBadge label="Placed" tone="live" />
              ) : (
                <StatusBadge label="No pin" tone="pending" />
              ),
          },
          {
            key: 'actions',
            align: 'right',
            hidden: !canUpdate && !canDelete,
            render: (branch) => (
              <IconButton
                size="small"
                aria-label={`Actions for ${branch.name}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, branch })}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            ),
          },
        ]}
      />

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {canUpdate && menu && (
          <MenuItem
            onClick={() => {
              setEditing({ branch: menu.branch });
              setMenu(null);
            }}
          >
            Edit
          </MenuItem>
        )}
        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.branch);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <BranchDialog
          branch={editing.branch}
          nextPosition={branches.length}
          onClose={() => setEditing(null)}
          onDone={(message) => {
            setEditing(null);
            toast(message);
            void refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove this branch?"
        message={
          deleting
            ? `${deleting.name} disappears from the map and the Contact page. Availability slots held there keep their appointments but lose the location.`
            : ''
        }
        confirmLabel="Remove"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
