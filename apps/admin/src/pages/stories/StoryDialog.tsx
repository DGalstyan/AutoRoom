import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { CarOrigin, Media, MediaInput, MediaKind } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { UploadField } from '@/components/UploadField';
import { KINDS, kindHint } from '@/pages/stories/kinds';
import { ORIGINS } from '@/pages/cars/carOptions';

/**
 * Add or edit a video.
 *
 * The customer fields appear only for a customer story. They are what the
 * Story Wall renders per tile — customer, car, origin, why they chose AutoRoom,
 * how it went — and showing them against a founder film would invite someone to
 * fill in a "customer" for a video that has none.
 */
export function StoryDialog({
  item,
  defaultKind,
  onClose,
  onDone,
}: {
  item?: Media;
  defaultKind: MediaKind;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();

  const [draft, setDraft] = useState<MediaInput>(() =>
    item
      ? {
          kind: item.kind,
          title: item.title,
          videoUrl: item.videoUrl,
          posterUrl: item.posterUrl,
          customerName: item.customerName,
          carLabel: item.carLabel,
          origin: item.origin,
          whyChosen: item.whyChosen,
          experience: item.experience,
          position: item.position,
          published: Boolean(item.publishedAt),
        }
      : {
          kind: defaultKind,
          title: '',
          videoUrl: '',
          posterUrl: null,
          customerName: null,
          carLabel: null,
          origin: null,
          whyChosen: null,
          experience: null,
          position: 0,
          published: false,
        },
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => (item ? api.media.update(item.id, draft) : api.media.create(draft)),
    onSuccess: () => onDone(item ? 'Saved.' : 'Video added.'),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof MediaInput>(key: K, value: MediaInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const isStory = draft.kind === 'CUSTOMER_STORY';
  const incomplete = !draft.title.trim() || !draft.videoUrl.trim();

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>{item ? 'Edit video' : 'Add video'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Kind"
              value={draft.kind}
              onChange={(event) => set('kind', event.target.value as MediaKind)}
              select
              fullWidth
              helperText={kindHint(draft.kind)}
            >
              {KINDS.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Title"
              value={draft.title}
              onChange={(event) => set('title', event.target.value)}
              required
              fullWidth
            />

            <UploadField
              label="Video"
              accept="video/mp4,video/webm"
              value={draft.videoUrl || null}
              onChange={(url) => set('videoUrl', url ?? '')}
              helperText="MP4 or WebM."
              disabled={mutation.isPending}
              preview={(url) => (
                <Box
                  component="video"
                  src={url}
                  controls
                  preload="metadata"
                  sx={{ width: '100%', maxHeight: 220, display: 'block' }}
                />
              )}
            />

            <UploadField
              label="Poster"
              accept="image/*"
              value={draft.posterUrl ?? null}
              onChange={(url) => set('posterUrl', url)}
              helperText="The still shown before play. Without one the tile is black."
              disabled={mutation.isPending}
              preview={(url) => (
                <Box
                  component="img"
                  src={url}
                  alt=""
                  sx={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
                />
              )}
            />

            {isStory && (
              <>
                <Divider />
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                  What the wall shows about this story.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Customer"
                    value={draft.customerName ?? ''}
                    onChange={(event) => set('customerName', event.target.value || null)}
                    fullWidth
                  />
                  <TextField
                    label="Car"
                    value={draft.carLabel ?? ''}
                    onChange={(event) => set('carLabel', event.target.value || null)}
                    fullWidth
                    helperText="Free text, e.g. “Zeekr 001 2024”."
                  />
                </Stack>

                <TextField
                  label="Origin"
                  value={draft.origin ?? ''}
                  onChange={(event) => set('origin', (event.target.value || null) as CarOrigin)}
                  select
                  fullWidth
                >
                  <MenuItem value="">Not stated</MenuItem>
                  {ORIGINS.map((entry) => (
                    <MenuItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Why they chose AutoRoom"
                  value={draft.whyChosen ?? ''}
                  onChange={(event) => set('whyChosen', event.target.value || null)}
                  multiline
                  minRows={2}
                  fullWidth
                />
                <TextField
                  label="How it went"
                  value={draft.experience ?? ''}
                  onChange={(event) => set('experience', event.target.value || null)}
                  multiline
                  minRows={2}
                  fullWidth
                />
                <Divider />
              </>
            )}

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <TextField
                label="Position"
                type="number"
                value={draft.position}
                onChange={(event) => set('position', Math.max(0, Number(event.target.value) || 0))}
                sx={{ width: 140 }}
                slotProps={{ htmlInput: { min: 0, max: 999 } }}
                helperText="Lower shows first."
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.published}
                    onChange={(event) => set('published', event.target.checked)}
                  />
                }
                label="Published"
                sx={{ mt: -2 }}
              />
            </Stack>
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
