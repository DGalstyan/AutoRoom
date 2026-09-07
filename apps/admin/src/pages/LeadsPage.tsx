import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Lead, LeadStatus } from '@autoroom/api/client';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { STATUSES, statusTone } from '@/pages/leads/status';

/**
 * Leads — the CRM inbox for every submission from the public site's
 * lead-capture entry points (Universal popup, Quiz popup, Contact page
 * form). `references/components.md`'s `LeadPayload`, landed via
 * `POST /leads` (see `apps/api/src/routes/leads.ts`).
 *
 * No create/edit form here on purpose: a lead is never authored by staff,
 * only received and worked — the row menu advances `status` and the row
 * itself already shows everything the visitor submitted.
 */
export function LeadsPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; lead: Lead } | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);

  const canUpdate = identity?.permissions.includes('leads:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('leads:DELETE') ?? false;

  const leadsQuery = useQuery({
    queryKey: ['leads', status],
    queryFn: () => api.leads.list({ ...(status ? { status } : {}), take: 100 }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['leads'] });

  const statusMutation = useMutation({
    mutationFn: ({ lead, next }: { lead: Lead; next: LeadStatus }) =>
      api.leads.updateStatus(lead.id, { status: next }),
    onSuccess: (_data, { next }) => {
      toast(`Marked ${next.toLowerCase()}.`);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.leads.remove(id),
    onSuccess: () => {
      toast('Lead removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const leads = leadsQuery.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 1100 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Leads
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Submissions from the Universal popup, Quiz, and Contact page form.
          </Typography>
        </Box>

        <TextField
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as LeadStatus | '')}
          select
          size="small"
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">Any status</MenuItem>
          {STATUSES.map((entry) => (
            <MenuItem key={entry.value} value={entry.value}>
              {entry.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <DataTable
        rows={leads}
        getRowId={(lead) => lead.id}
        isPending={leadsQuery.isPending}
        error={leadsQuery.isError ? leadsQuery.error : undefined}
        errorMessage="Could not load leads."
        emptyMessage="No leads yet."
        minWidth={960}
        columns={[
          {
            key: 'createdAt',
            header: 'Received',
            width: 140,
            render: (lead) => (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                {new Date(lead.createdAt).toLocaleString()}
              </Typography>
            ),
          },
          {
            key: 'name',
            header: 'Contact',
            render: (lead) => (
              <Box>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{lead.name}</Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                  {lead.phone}
                  {lead.email ? ` · ${lead.email}` : ''}
                </Typography>
              </Box>
            ),
          },
          {
            key: 'about',
            header: 'About',
            render: (lead) => {
              const parts = [
                lead.carName,
                lead.topic,
                lead.interest,
                lead.budget,
                lead.financing,
              ].filter(Boolean);
              return (
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem' }}>
                    {parts.length > 0 ? parts.join(' · ') : '—'}
                  </Typography>
                  {lead.comment && (
                    <Tooltip title={lead.comment}>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          maxWidth: 260,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        “{lead.comment}”
                      </Typography>
                    </Tooltip>
                  )}
                </Box>
              );
            },
          },
          {
            key: 'source',
            header: 'Source',
            render: (lead) => (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                {lead.sourcePage} · {lead.sourceCta}
              </Typography>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (lead) => {
              const entry = statusTone(lead.status);
              return <StatusBadge label={entry.label} tone={entry.tone} />;
            },
          },
          {
            key: 'actions',
            align: 'right',
            hidden: !canUpdate && !canDelete,
            render: (lead) => (
              <IconButton
                size="small"
                aria-label={`Actions for ${lead.name}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, lead })}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            ),
          },
        ]}
      />

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {canUpdate &&
          menu &&
          STATUSES.filter((entry) => entry.value !== menu.lead.status).map((entry) => (
            <MenuItem
              key={entry.value}
              onClick={() => {
                statusMutation.mutate({ lead: menu.lead, next: entry.value });
                setMenu(null);
              }}
            >
              Mark {entry.label.toLowerCase()}
            </MenuItem>
          ))}
        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.lead);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this lead?"
        message={deleting ? `${deleting.name}'s submission is permanently removed.` : ''}
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
