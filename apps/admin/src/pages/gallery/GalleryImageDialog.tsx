import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { GalleryImage, GalleryImageInput } from '@autoroom/api/client';
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
import { errorMessage, extractFieldErrors } from '@/lib/api';
import { UploadField } from '@/components/UploadField';

/** Add or edit one tile in the About page's photo collage. */
export function GalleryImageDialog({
  image,
  nextPosition,
  onClose,
  onDone,
}: {
  image?: GalleryImage;
  nextPosition: number;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();

  const [draft, setDraft] = useState<GalleryImageInput>(() =>
    image
      ? { imageUrl: image.imageUrl, position: image.position }
      : { imageUrl: '', position: nextPosition },
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => (image ? api.gallery.update(image.id, draft) : api.gallery.create(draft)),
    onSuccess: () => onDone(image ? 'Image saved.' : 'Image added.'),
    onError: (caught) => {
      setFieldErrors(extractFieldErrors(caught));
      setError(errorMessage(caught));
    },
  });

  function set<K extends keyof GalleryImageInput>(key: K, value: GalleryImageInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setFieldErrors({});
          mutation.mutate();
        }}
      >
        <DialogTitle>{image ? 'Edit gallery image' : 'Add gallery image'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <UploadField
              label="Image"
              accept="image/*"
              value={draft.imageUrl || null}
              onChange={(url) => set('imageUrl', url ?? '')}
              helperText={
                fieldErrors.imageUrl ??
                'A landscape crop looks best — tiles fill a wide aspect ratio.'
              }
              disabled={mutation.isPending}
              preview={(url) => (
                <Avatar src={url} alt="" variant="rounded" sx={{ width: 160, height: 90 }} />
              )}
            />

            <TextField
              label="Position"
              type="number"
              value={draft.position}
              onChange={(event) => set('position', Math.max(0, Number(event.target.value) || 0))}
              sx={{ width: 140 }}
              slotProps={{ htmlInput: { min: 0, max: 999 } }}
              error={Boolean(fieldErrors.position)}
              helperText={fieldErrors.position ?? 'Lower shows first.'}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!draft.imageUrl.trim() || mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
