import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TeamMember } from '@autoroom/api/client';
import { Alert, Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { TeamMemberDialog } from '@/pages/team/TeamMemberDialog';
import { brand } from '@/theme';

/**
 * Team — the "Մեր թիմը" grid on the About page: photo, name, title, and an
 * optional LinkedIn link.
 */
export function TeamPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [menu, setMenu] = useState<{ anchor: HTMLElement; member: TeamMember } | null>(null);
  const [editing, setEditing] = useState<{ member?: TeamMember } | null>(null);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

  const canCreate = identity?.permissions.includes('team:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('team:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('team:DELETE') ?? false;

  const teamQuery = useQuery({
    queryKey: ['team'],
    queryFn: () => api.team.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['team'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.team.remove(id),
    onSuccess: () => {
      toast('Team member removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const members = teamQuery.data?.items ?? [];
  const missingPhoto = members.filter((member) => !member.photoUrl).length;

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Team
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            The "Մեր թիմը" grid on the About page.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add team member
          </Button>
        )}
      </Stack>

      {/* A row with no photo still saves fine, but the public card is a photo
          card — a name/title with no image behind it reads as broken. */}
      {missingPhoto > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {missingPhoto === 1
            ? 'One team member has no photo uploaded yet.'
            : `${missingPhoto} team members have no photo uploaded yet.`}
        </Alert>
      )}

      <DataTable
        rows={members}
        getRowId={(member) => member.id}
        isPending={teamQuery.isPending}
        error={teamQuery.isError ? teamQuery.error : undefined}
        errorMessage="Could not load the team."
        emptyMessage="No team members yet."
        minWidth={720}
        columns={[
          {
            key: 'photo',
            width: 72,
            render: (member) => (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: brand.surfaceLight,
                  border: `1px solid ${brand.lineLight}`,
                  overflow: 'hidden',
                }}
              >
                {member.photoUrl && (
                  <Box
                    component="img"
                    src={member.photoUrl}
                    alt=""
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </Box>
            ),
          },
          {
            key: 'name',
            header: 'Name',
            render: (member) => (
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{member.name}</Typography>
            ),
          },
          {
            key: 'title',
            header: 'Title',
            render: (member) => (
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                {member.title}
              </Typography>
            ),
          },
          {
            key: 'linkedinUrl',
            header: 'LinkedIn',
            render: (member) =>
              member.linkedinUrl ? (
                <Typography
                  component="a"
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontSize: '0.8125rem', color: 'primary.main' }}
                >
                  {member.linkedinUrl.replace(/^https?:\/\//, '')}
                </Typography>
              ) : (
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>—</Typography>
              ),
          },
          {
            key: 'actions',
            align: 'right',
            hidden: !canUpdate && !canDelete,
            render: (member) => (
              <IconButton
                size="small"
                aria-label={`Actions for ${member.name}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, member })}
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
              setEditing({ member: menu.member });
              setMenu(null);
            }}
          >
            Edit
          </MenuItem>
        )}
        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.member);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <TeamMemberDialog
          member={editing.member}
          nextPosition={members.length}
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
        title="Remove this team member?"
        message={deleting ? `${deleting.name} disappears from the About page's team grid.` : ''}
        confirmLabel="Remove"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
