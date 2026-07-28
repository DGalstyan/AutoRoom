import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CarImage, ImageAlbum } from '@autoroom/api/client';
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/CloudUploadOutlined';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ALBUMS } from '@/pages/cars/carOptions';
import { brand } from '@/theme';

/**
 * The seven photo albums, each an independent drop target.
 *
 * Upload and attach are two calls — the file goes to `/uploads` and the
 * returned URL is attached to the car — so the same uploader serves machinery
 * and order documents later without either knowing about the other. It also
 * means an attach that fails leaves an orphaned file rather than a car row
 * pointing at nothing, which is the better of the two failures.
 *
 * Only available once the car exists: images hang off a car id, and inventing
 * one before the first save would mean reconciling uploads against a car that
 * might never be created.
 */
export function ImageAlbums({
  carId,
  images,
  readOnly,
}: {
  carId: string;
  images: CarImage[];
  readOnly: boolean;
}) {
  return (
    <Stack spacing={3}>
      {ALBUMS.map((album) => (
        <AlbumRow
          key={album.value}
          carId={carId}
          album={album.value}
          label={album.label}
          hint={album.hint}
          images={images.filter((image) => image.album === album.value)}
          readOnly={readOnly}
        />
      ))}
    </Stack>
  );
}

function AlbumRow({
  carId,
  album,
  label,
  hint,
  images,
  readOnly,
}: {
  carId: string;
  album: ImageAlbum;
  label: string;
  hint: string;
  images: CarImage[];
  readOnly: boolean;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['car', carId] });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      // Sequential rather than parallel: a dropped folder of 30 photos would
      // otherwise open 30 sockets and the progress would be a lie.
      for (const file of files) {
        const uploaded = await api.upload(file);
        await api.cars.addImage(carId, { album, url: uploaded.url });
      }
      return files.length;
    },
    onSuccess: (count) => {
      toast(`${count} file${count === 1 ? '' : 's'} added to ${label}.`);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error, 'Upload failed.'), 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (imageId: string) => api.cars.removeImage(carId, imageId),
    onSuccess: () => {
      toast('Removed.');
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  function accept(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length > 0) uploadMutation.mutate(files);
  }

  const isVideo = album === 'VIDEO';

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1 }}>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{hint}</Typography>
      </Stack>

      <Box
        onDragOver={(event) => {
          if (readOnly) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (readOnly) return;
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files);
        }}
        sx={{
          border: `1px dashed ${dragging ? brand.accent : brand.lineLight}`,
          bgcolor: dragging ? `${brand.accent}0A` : 'transparent',
          borderRadius: 2,
          p: 1.5,
          transition: 'border-color 120ms, background-color 120ms',
        }}
      >
        {images.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
              gap: 1.25,
              mb: readOnly ? 0 : 1.5,
            }}
          >
            {images.map((image) => (
              <Box
                key={image.id}
                sx={{
                  position: 'relative',
                  aspectRatio: '4 / 3',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  bgcolor: brand.surfaceLight,
                  border: `1px solid ${brand.lineLight}`,
                }}
              >
                {isVideo ? (
                  <Box
                    component="video"
                    src={image.url}
                    muted
                    playsInline
                    preload="metadata"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={image.url}
                    alt=""
                    loading="lazy"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}

                {!readOnly && (
                  <IconButton
                    size="small"
                    aria-label="Remove"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(image.id)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: '#000000A6',
                      color: '#FFFFFF',
                      '&:hover': { bgcolor: '#000000CC' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        )}

        {!readOnly && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Button
              onClick={() => inputRef.current?.click()}
              startIcon={
                uploadMutation.isPending ? (
                  <CircularProgress size={14} thickness={5} />
                ) : (
                  <UploadIcon />
                )
              }
              disabled={uploadMutation.isPending}
              size="small"
            >
              {uploadMutation.isPending ? 'Uploading…' : 'Add files'}
            </Button>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              or drop them here · max 25 MB each
            </Typography>
            <input
              ref={inputRef}
              type="file"
              accept={isVideo ? 'video/mp4,video/webm' : 'image/*'}
              multiple
              hidden
              onChange={(event) => {
                accept(event.target.files);
                // Reset so re-picking the same file fires change again.
                event.target.value = '';
              }}
            />
          </Stack>
        )}

        {images.length === 0 && readOnly && (
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', py: 1 }}>
            Empty.
          </Typography>
        )}
      </Box>

      {album === 'EXTERIOR' && images.length === 0 && !readOnly && (
        <Alert severity="info" sx={{ mt: 1 }}>
          A car needs at least one image before it can be published.
        </Alert>
      )}
    </Box>
  );
}
