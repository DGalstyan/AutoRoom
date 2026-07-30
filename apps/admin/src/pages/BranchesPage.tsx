import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Branch } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {branchesQuery.isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
          </Box>
        ) : branchesQuery.isError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {errorMessage(branchesQuery.error, 'Could not load branches.')}
          </Alert>
        ) : branches.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
            No branches yet.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 76 }} />
                  <TableCell>Branch</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Map</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id} hover>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {branch.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        {branch.city}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{branch.address}</TableCell>
                    <TableCell sx={{ fontFamily: mono, fontSize: '0.8125rem' }}>
                      {branch.phone}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{branch.hours}</TableCell>
                    <TableCell>
                      {branch.lat !== null && branch.lng !== null ? (
                        <Chip
                          label="Placed"
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: brand.success,
                            bgcolor: `${brand.success}18`,
                          }}
                        />
                      ) : (
                        <Chip
                          label="No pin"
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: brand.warn,
                            bgcolor: `${brand.warn}18`,
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {(canUpdate || canDelete) && (
                        <IconButton
                          size="small"
                          aria-label={`Actions for ${branch.name}`}
                          onClick={(event) => setMenu({ anchor: event.currentTarget, branch })}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

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
