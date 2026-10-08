import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BlogPost } from '@autoroom/api/client';
import { Box, Button, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { BlogDialog } from '@/pages/blog/BlogDialog';
import { formatDateTime } from '@/pages/availability/time';

/**
 * The articles behind `/blog`. A draft can be saved half-written; publishing
 * needs the Armenian text, the one language the site guarantees.
 */
export function BlogPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [menu, setMenu] = useState<{ anchor: HTMLElement; post: BlogPost } | null>(null);
  const [editing, setEditing] = useState<{ post?: BlogPost } | null>(null);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);

  const can = (action: string) => identity?.permissions.includes(`blog:${action}`) ?? false;

  const query = useQuery({ queryKey: ['blog'], queryFn: () => api.blog.list({ take: 100 }) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['blog'] });

  const publishMutation = useMutation({
    mutationFn: ({ post, published }: { post: BlogPost; published: boolean }) =>
      api.blog.setPublished(post.id, published),
    onSuccess: (post) => {
      toast(post.publishedAt ? 'Published — live on the site.' : 'Unpublished — hidden.');
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.blog.remove(id),
    onSuccess: () => {
      toast('Article removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const items = query.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Blog
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Articles shown at autoroom.am/blog.
          </Typography>
        </Box>
        {can('CREATE') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add article
          </Button>
        )}
      </Stack>

      <DataTable
        rows={items}
        getRowId={(post) => post.id}
        isPending={query.isPending}
        error={query.isError ? query.error : undefined}
        errorMessage="Could not load the articles."
        emptyMessage="No articles yet."
        minWidth={760}
        onRowClick={can('UPDATE') ? (post) => setEditing({ post }) : undefined}
        columns={[
          {
            key: 'title',
            header: 'Article',
            render: (post) => (
              <>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {post.title.hy}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  /blog/{post.slug}
                </Typography>
              </>
            ),
          },
          {
            key: 'state',
            header: 'State',
            render: (post) =>
              post.publishedAt ? (
                <StatusBadge label="Published" tone="live" />
              ) : post.body.hy ? (
                <StatusBadge label="Draft" tone="muted" />
              ) : (
                <StatusBadge label="Needs text" tone="pending" />
              ),
          },
          {
            key: 'when',
            header: 'Published',
            render: (post) => (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                {post.publishedAt ? formatDateTime(post.publishedAt) : '—'}
              </Typography>
            ),
          },
          {
            key: 'actions',
            align: 'right',
            hidden: !can('UPDATE') && !can('DELETE') && !can('PUBLISH'),
            render: (post) => (
              <IconButton
                size="small"
                aria-label={`Actions for ${post.title.hy}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setMenu({ anchor: event.currentTarget, post });
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            ),
          },
        ]}
      />

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {can('UPDATE') && menu && (
          <MenuItem
            onClick={() => {
              setEditing({ post: menu.post });
              setMenu(null);
            }}
          >
            Edit
          </MenuItem>
        )}
        {can('PUBLISH') &&
          menu &&
          (menu.post.publishedAt ? (
            <MenuItem
              onClick={() => {
                publishMutation.mutate({ post: menu.post, published: false });
                setMenu(null);
              }}
            >
              Unpublish
            </MenuItem>
          ) : (
            <Tooltip title={menu.post.body.hy ? '' : 'Write the Armenian text first'}>
              <span>
                <MenuItem
                  disabled={!menu.post.body.hy}
                  onClick={() => {
                    publishMutation.mutate({ post: menu.post, published: true });
                    setMenu(null);
                  }}
                >
                  Publish
                </MenuItem>
              </span>
            </Tooltip>
          ))}
        {can('DELETE') && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.post);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <BlogDialog
          post={editing.post}
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
        title="Remove this article?"
        message={deleting ? `“${deleting.title.hy}” will be removed. This cannot be undone.` : ''}
        confirmLabel="Remove"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
