import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Media, MediaKind } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { StoryDialog } from '@/pages/stories/StoryDialog';
import { KINDS, kindLabel } from '@/pages/stories/kinds';
import { brand, mono } from '@/theme';

/**
 * The video behind the homepage — Section 7's Customer Story Wall above all,
 * plus the founder film and guide reels, which are the same thing to an editor.
 *
 * Shown as a wall rather than a table, because that is what it becomes on the
 * site: the poster frame is the content, and a row of filenames would not tell
 * anyone whether a story looks right.
 */
export function StoriesPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [kind, setKind] = useState<MediaKind | ''>('CUSTOMER_STORY');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: Media } | null>(null);
  const [editing, setEditing] = useState<{ item?: Media } | null>(null);
  const [deleting, setDeleting] = useState<Media | null>(null);

  const canCreate = identity?.permissions.includes('media:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('media:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('media:DELETE') ?? false;

  const mediaQuery = useQuery({
    queryKey: ['media', kind],
    queryFn: () => api.media.list({ ...(kind ? { kind } : {}), take: 100 }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['media'] });

  const publishMutation = useMutation({
    mutationFn: ({ item, published }: { item: Media; published: boolean }) =>
      api.media.update(item.id, { ...toInput(item), published }),
    onSuccess: (item) => {
      toast(item.publishedAt ? 'Published — live on the site.' : 'Unpublished — hidden.');
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.media.remove(id),
    onSuccess: () => {
      toast('Removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const items = mediaQuery.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Stories &amp; video
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            The homepage Customer Story Wall, the founder film and guide reels.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add video
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ p: 2, borderBottom: `1px solid ${brand.lineLight}` }}
        >
          <TextField
            label="Kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as MediaKind | '')}
            select
            size="small"
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All video</MenuItem>
            {KINDS.map((entry) => (
              <MenuItem key={entry.value} value={entry.value}>
                {entry.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {mediaQuery.isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
          </Box>
        ) : mediaQuery.isError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {errorMessage(mediaQuery.error, 'Could not load video.')}
          </Alert>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Nothing here yet.
              {canCreate && ' Add a video and it appears on the wall once published.'}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              p: 2.5,
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
            }}
          >
            {items.map((item) => (
              <StoryCard
                key={item.id}
                item={item}
                onMenu={canUpdate || canDelete ? (anchor) => setMenu({ anchor, item }) : undefined}
              />
            ))}
          </Box>
        )}
      </Paper>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {canUpdate && menu && (
          <MenuItem
            onClick={() => {
              setEditing({ item: menu.item });
              setMenu(null);
            }}
          >
            Edit
          </MenuItem>
        )}
        {canUpdate && menu && (
          <MenuItem
            onClick={() => {
              publishMutation.mutate({ item: menu.item, published: !menu.item.publishedAt });
              setMenu(null);
            }}
          >
            {menu.item.publishedAt ? 'Unpublish' : 'Publish'}
          </MenuItem>
        )}
        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.item);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <StoryDialog
          item={editing.item}
          defaultKind={kind || 'CUSTOMER_STORY'}
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
        title="Remove this video?"
        message={
          deleting
            ? `“${deleting.title}” will disappear from the site. The uploaded file itself is left in place.`
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

/** One tile. The poster is the content, so it leads. */
function StoryCard({ item, onMenu }: { item: Media; onMenu?: (anchor: HTMLElement) => void }) {
  const live = Boolean(item.publishedAt);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '16 / 9',
          bgcolor: brand.ink,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {item.posterUrl ? (
          <Box
            component="img"
            src={item.posterUrl}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          // No poster is worth seeing at a glance — on the site this tile would
          // be a black rectangle until it plays.
          <Stack sx={{ alignItems: 'center', color: brand.muted }}>
            <PlayCircleOutlineIcon sx={{ fontSize: 34 }} />
            <Typography sx={{ fontSize: '0.6875rem', mt: 0.5 }}>No poster</Typography>
          </Stack>
        )}

        {/* Filled, not tinted: a 12% wash over a photograph is unreadable. */}
        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
          <StatusBadge label={live ? 'Live' : 'Draft'} tone={live ? 'live' : 'muted'} filled />
        </Box>
      </Box>

      <Stack direction="row" sx={{ p: 1.5, gap: 1, alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }} noWrap>
            {item.title}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }} noWrap>
            {item.kind === 'CUSTOMER_STORY'
              ? [item.customerName, item.carLabel].filter(Boolean).join(' · ') ||
                'No customer details'
              : kindLabel(item.kind)}
          </Typography>
          <Typography
            sx={{ fontFamily: mono, fontSize: '0.6875rem', color: 'text.secondary', mt: 0.25 }}
          >
            #{item.position}
          </Typography>
        </Box>

        {onMenu && (
          <IconButton
            size="small"
            aria-label={`Actions for ${item.title}`}
            onClick={(event) => onMenu(event.currentTarget)}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
}

export function toInput(item: Media) {
  return {
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
  };
}
