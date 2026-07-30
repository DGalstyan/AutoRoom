import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Faq, FaqTopic } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { FaqDialog } from '@/pages/faq/FaqDialog';
import { TOPICS, topicLabel } from '@/pages/faq/topics';
import { mono } from '@/theme';

/**
 * The FAQ behind Homepage S9 and the China and USA page sections.
 *
 * The list leads with whether a question has an answer, because that is the
 * state that actually matters here: the spec ships ten China questions with no
 * answers written, and the job this screen exists for is turning those into
 * published entries one at a time.
 */
export function FaqPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState<FaqTopic | ''>('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item: Faq } | null>(null);
  const [editing, setEditing] = useState<{ item?: Faq } | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);

  const canCreate = identity?.permissions.includes('faq:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('faq:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('faq:DELETE') ?? false;
  const canPublish = identity?.permissions.includes('faq:PUBLISH') ?? false;

  const faqQuery = useQuery({
    queryKey: ['faq', topic],
    queryFn: () => api.faq.list({ ...(topic ? { topic } : {}), take: 200 }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['faq'] });

  const publishMutation = useMutation({
    mutationFn: ({ item, published }: { item: Faq; published: boolean }) =>
      api.faq.setPublished(item.id, published),
    onSuccess: (item) => {
      toast(item.publishedAt ? 'Published — live on the site.' : 'Unpublished — hidden.');
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.faq.remove(id),
    onSuccess: () => {
      toast('Question removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const items = faqQuery.data?.items ?? [];
  const unanswered = items.filter((item) => !item.answer).length;

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            FAQ
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Homepage Section 9, and the China and USA page sections.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add question
          </Button>
        )}
      </Stack>

      {/* The work queue, stated plainly. These are the questions the spec gave
          without answers, and they stay invisible to the site until written. */}
      {unanswered > 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          {unanswered === 1
            ? 'One question has no answer yet, so it cannot be published.'
            : `${unanswered} questions have no answer yet, so they cannot be published.`}
        </Alert>
      )}

      <DataTable
        rows={items}
        getRowId={(item) => item.id}
        isPending={faqQuery.isPending}
        error={faqQuery.isError ? faqQuery.error : undefined}
        errorMessage="Could not load the FAQ."
        emptyMessage="No questions in this section yet."
        minWidth={860}
        toolbar={
          <TextField
            label="Section"
            value={topic}
            onChange={(event) => setTopic(event.target.value as FaqTopic | '')}
            select
            size="small"
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All sections</MenuItem>
            {TOPICS.map((entry) => (
              <MenuItem key={entry.value} value={entry.value}>
                {entry.label}
              </MenuItem>
            ))}
          </TextField>
        }
        columns={[
          {
            key: 'position',
            width: 56,
            render: (item) => (
              <Typography sx={{ fontFamily: mono, fontSize: '0.75rem', color: 'text.secondary' }}>
                {item.position}
              </Typography>
            ),
          },
          {
            key: 'question',
            header: 'Question',
            render: (item) => (
              <>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {item.question}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    mt: 0.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.answer ?? 'No answer written yet.'}
                </Typography>
              </>
            ),
          },
          {
            key: 'topic',
            header: 'Section',
            render: (item) => (
              <Typography sx={{ fontSize: '0.875rem' }}>{topicLabel(item.topic)}</Typography>
            ),
          },
          {
            key: 'state',
            header: 'State',
            render: (item) =>
              item.publishedAt ? (
                <StatusBadge label="Published" tone="live" />
              ) : item.answer ? (
                <StatusBadge label="Draft" tone="muted" />
              ) : (
                <StatusBadge label="Needs answer" tone="pending" />
              ),
          },
          {
            key: 'actions',
            align: 'right',
            hidden: !canUpdate && !canDelete && !canPublish,
            render: (item) => (
              <IconButton
                size="small"
                aria-label={`Actions for ${item.question}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, item })}
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
              setEditing({ item: menu.item });
              setMenu(null);
            }}
          >
            {menu.item.answer ? 'Edit' : 'Write answer'}
          </MenuItem>
        )}
        {canPublish &&
          menu &&
          // Disabled rather than hidden when unanswered: the reason it cannot
          // publish is the point, and a missing entry would not explain itself.
          (menu.item.publishedAt ? (
            <MenuItem
              onClick={() => {
                publishMutation.mutate({ item: menu.item, published: false });
                setMenu(null);
              }}
            >
              Unpublish
            </MenuItem>
          ) : (
            <Tooltip title={menu.item.answer ? '' : 'Write an answer first'}>
              <span>
                <MenuItem
                  disabled={!menu.item.answer}
                  onClick={() => {
                    publishMutation.mutate({ item: menu.item, published: true });
                    setMenu(null);
                  }}
                >
                  Publish
                </MenuItem>
              </span>
            </Tooltip>
          ))}
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
        <FaqDialog
          item={editing.item}
          defaultTopic={topic || 'CHINA'}
          nextPosition={items.length}
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
        title="Remove this question?"
        message={
          deleting
            ? `“${deleting.question}” will be removed from the FAQ. This cannot be undone.`
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
