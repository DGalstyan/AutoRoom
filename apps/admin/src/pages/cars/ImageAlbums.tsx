import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { CarImage, ImageAlbum } from '@autoroom/api/client';
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/CloudUploadOutlined';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ALBUMS } from '@/pages/cars/carOptions';
import { brand } from '@/theme';

/** A file uploaded before the car exists to attach it to — not a `CarImage` yet. */
export interface StagedImage {
  /** Client-only id: this row has no server counterpart until the car is created. */
  id: string;
  album: ImageAlbum;
  url: string;
}

/**
 * The seven photo albums, each an independent drop target.
 *
 * `onAdd`/`onRemove` are injected rather than calling the API directly, so the
 * same component serves two situations: attaching to a car that already
 * exists, and staging uploads for one that doesn't yet (the file still goes to
 * `/uploads` immediately — only the "attach to a car row" step is deferred).
 */
export function ImageAlbums({
  images,
  readOnly,
  onAdd,
  onRemove,
}: {
  images: (CarImage | StagedImage)[];
  readOnly: boolean;
  /** Uploads one file and attaches it to the given album. */
  onAdd: (album: ImageAlbum, file: File) => Promise<void>;
  onRemove: (image: CarImage | StagedImage) => Promise<void>;
}) {
  return (
    <Stack spacing={3}>
      {ALBUMS.map((album) => (
        <AlbumRow
          key={album.value}
          album={album.value}
          label={album.label}
          hint={album.hint}
          images={images.filter((image) => image.album === album.value)}
          readOnly={readOnly}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ))}
    </Stack>
  );
}

function AlbumRow({
  album,
  label,
  hint,
  images,
  readOnly,
  onAdd,
  onRemove,
}: {
  album: ImageAlbum;
  label: string;
  hint: string;
  images: (CarImage | StagedImage)[];
  readOnly: boolean;
  onAdd: (album: ImageAlbum, file: File) => Promise<void>;
  onRemove: (image: CarImage | StagedImage) => Promise<void>;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      // Sequential rather than parallel: a dropped folder of 30 photos would
      // otherwise open 30 sockets and the progress would be a lie.
      for (const file of files) await onAdd(album, file);
      return files.length;
    },
    onSuccess: (count) => toast(`${count} file${count === 1 ? '' : 's'} added to ${label}.`),
    onError: (error) => toast(errorMessage(error, 'Upload failed.'), 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: onRemove,
    onSuccess: () => toast('Removed.'),
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
                    onClick={() => removeMutation.mutate(image)}
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
