import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { TeamMember, TeamMemberInput } from '@autoroom/api/client';
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { UploadField } from '@/components/UploadField';

/** Add or edit a person in the About page's "Մեր թիմը" grid. */
export function TeamMemberDialog({
  member,
  nextPosition,
  onClose,
  onDone,
}: {
  member?: TeamMember;
  nextPosition: number;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();

  const [draft, setDraft] = useState<TeamMemberInput>(() =>
    member
      ? {
          name: member.name,
          title: member.title,
          photoUrl: member.photoUrl,
          linkedinUrl: member.linkedinUrl,
          position: member.position,
        }
      : {
          name: '',
          title: '',
          photoUrl: null,
          linkedinUrl: null,
          position: nextPosition,
        },
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => (member ? api.team.update(member.id, draft) : api.team.create(draft)),
    onSuccess: () => onDone(member ? 'Team member saved.' : 'Team member added.'),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof TeamMemberInput>(key: K, value: TeamMemberInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const incomplete = !draft.name.trim() || !draft.title.trim();

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>{member ? 'Edit team member' : 'Add team member'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Name"
              value={draft.name}
              onChange={(event) => set('name', event.target.value)}
              required
              fullWidth
              helperText="e.g. Դավիթ Պետրոսյան"
            />

            <TextField
              label="Title"
              value={draft.title}
              onChange={(event) => set('title', event.target.value)}
              required
              fullWidth
              helperText="e.g. CEO"
            />

            <UploadField
              label="Photo"
              accept="image/*"
              value={draft.photoUrl ?? null}
              onChange={(url) => set('photoUrl', url)}
              helperText="Shown as the full card background — a portrait crop looks best."
              disabled={mutation.isPending}
              preview={(url) => (
                <Avatar src={url} alt="" variant="rounded" sx={{ width: 96, height: 96 }} />
              )}
            />

            <TextField
              label="LinkedIn URL"
              value={draft.linkedinUrl ?? ''}
              onChange={(event) => set('linkedinUrl', event.target.value || null)}
              fullWidth
              helperText="Optional — the card only shows the LinkedIn icon when this is set."
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
