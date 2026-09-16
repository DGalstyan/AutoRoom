import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GalleryImage } from '@autoroom/api/client';
import { Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { GalleryImageDialog } from '@/pages/gallery/GalleryImageDialog';
import { brand } from '@/theme';

/**
 * Gallery — the photo collage on the About page, right below the "Մեր
 * թիմը" team grid (`PhotoGallery` in apps/web). Every image here is what
 * renders there, in `position` order — no bundled placeholder photos, and
 * the section itself disappears from the public page while this is empty.
 */
export function GalleryPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [menu, setMenu] = useState<{ anchor: HTMLElement; image: GalleryImage } | null>(null);
  const [editing, setEditing] = useState<{ image?: GalleryImage } | null>(null);
  const [deleting, setDeleting] = useState<GalleryImage | null>(null);

  const canCreate = identity?.permissions.includes('gallery:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('gallery:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('gallery:DELETE') ?? false;

  const galleryQuery = useQuery({
    queryKey: ['gallery'],
    queryFn: () => api.gallery.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['gallery'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.gallery.remove(id),
    onSuccess: () => {
      toast('Image removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const images = galleryQuery.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Gallery
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            The photo collage on the About page, below the team grid.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add image
          </Button>
        )}
      </Stack>

      <DataTable
        rows={images}
        getRowId={(image) => image.id}
        isPending={galleryQuery.isPending}
        error={galleryQuery.isError ? galleryQuery.error : undefined}
        errorMessage="Could not load the gallery."
        emptyMessage="No images yet — the collage doesn't show on the About page until one is added."
        minWidth={480}
        columns={[
          {
            key: 'photo',
            width: 152,
            render: (image) => (
              <Box
                sx={{
                  width: 128,
                  height: 72,
                  borderRadius: 2,
                  bgcolor: brand.surfaceLight,
                  border: `1px solid ${brand.lineLight}`,
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={image.imageUrl}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ),
          },
          {
            key: 'position',
            header: 'Position',
            render: (image) => (
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {image.position}
              </Typography>
            ),
          },
          {
            key: 'actions',
            align: 'right',
            hidden: !canUpdate && !canDelete,
            render: (image) => (
              <IconButton
                size="small"
                aria-label={`Actions for image at position ${image.position}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, image })}
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
              setEditing({ image: menu.image });
              setMenu(null);
            }}
          >
            Edit
          </MenuItem>
        )}
        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.image);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <GalleryImageDialog
          image={editing.image}
          nextPosition={images.length}
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
        title="Remove this image?"
        message="This tile disappears from the About page's photo collage."
        confirmLabel="Remove"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
