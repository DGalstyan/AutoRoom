import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Lead, LeadStatus } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { MEETING_FORMAT_LABEL, STATUSES, statusTone } from '@/pages/leads/status';
import { formatDateTime } from '@/pages/availability/time';
import { mono } from '@/theme';

/**
 * The full record behind one `LeadsPage` row, reached by clicking it. Its own
 * `GET /leads/:id` (`api.leads.get`) rather than reusing `LeadsPage`'s list
 * query: a lead reached by direct link or reload has no warm cache to read,
 * and paging/filtering on the list would otherwise leave some leads with no
 * way to open a fresh one at all.
 */
export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);

  const canUpdate = identity?.permissions.includes('leads:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('leads:DELETE') ?? false;
  const canReadBranches = identity?.permissions.includes('branches:READ') ?? false;
  const canConvertToPartner =
    canUpdate &&
    (identity?.permissions.includes('partners:CREATE') ?? false) &&
    (identity?.permissions.includes('users:CREATE') ?? false);

  const leadQuery = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.leads.get(id!),
    enabled: Boolean(id),
  });
  const lead = leadQuery.data;

  // Same client-side id→name lookup `LeadsPage`'s "Meeting" column does —
  // `Lead` only stores `meetingBranchId`, never the branch's name.
  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.branches.list(),
    enabled: canReadBranches && lead?.meetingFormat === 'OFFICE',
  });
  const branchName =
    lead?.meetingBranchId &&
    branchesQuery.data?.items.find((branch) => branch.id === lead.meetingBranchId)?.name;

  // Local draft synced from the fetched lead once, not on every refetch —
  // otherwise a keystroke could be clobbered by a background refetch landing
  // mid-edit.
  const [syncedFrom, setSyncedFrom] = useState<string | null>(null);
  useEffect(() => {
    if (lead && syncedFrom !== lead.id) {
      setNotes(lead.notes ?? '');
      setSyncedFrom(lead.id);
    }
  }, [lead, syncedFrom]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['lead', id] });
    void queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const statusMutation = useMutation({
    mutationFn: (next: LeadStatus) => api.leads.updateStatus(id!, { status: next }),
    onSuccess: (_data, next) => {
      toast(`Marked ${next.toLowerCase()}.`);
      refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const notesMutation = useMutation({
    mutationFn: () => api.leads.updateStatus(id!, { notes: notes.trim() }),
    onSuccess: () => {
      toast('Notes saved.');
      refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.leads.remove(id!),
    onSuccess: () => {
      toast('Lead removed.');
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate('/leads');
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  if (leadQuery.isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  }

  if (leadQuery.isError || !lead) {
    return (
      <Box sx={{ maxWidth: 700 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage(leadQuery.error, 'This lead could not be found.')}
        </Alert>
        <Button component={RouterLink} to="/leads" startIcon={<ArrowBackIcon fontSize="small" />}>
          Back to Leads
        </Button>
      </Box>
    );
  }

  const entry = statusTone(lead.status);
  const meetingWhere =
    lead.meetingFormat === 'OFFICE'
      ? (branchName ?? 'Unknown branch')
      : lead.meetingFormat === 'OTHER'
        ? lead.meetingAddress
        : null;

  const aboutFields: [string, string | null][] = [
    ['Car', lead.carName],
    ['VIN', lead.carVin],
    ['Car link', lead.carLink],
    ['Topic', lead.topic],
    ['Interest', lead.interest],
    ['Budget', lead.budget],
    ['Financing', lead.financing],
    ['Timing', lead.timing],
    ['Contact channel', lead.channel],
    ['Colour', lead.color],
    ['Company', lead.company],
    ['Activity type', lead.activityType],
  ];
  const filledAboutFields = aboutFields.filter(([, value]) => Boolean(value));

  // Only the "Become a dealer" meeting-booking form fills any of these three —
  // every other lead-capture widget leaves them null. That is the same test
  // `serializeLead`'s own fields imply, just named for what it gates here.
  const isDealerLead = Boolean(lead.company || lead.activityType || lead.meetingFormat);

  return (
    <Box sx={{ maxWidth: 820 }}>
      <Button
        component={RouterLink}
        to="/leads"
        startIcon={<ArrowBackIcon fontSize="small" />}
        size="small"
        color="inherit"
        sx={{ mb: 1.5, ml: -1 }}
      >
        Leads
      </Button>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            {lead.name}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {lead.phone}
            {lead.email ? ` · ${lead.email}` : ''}
          </Typography>
        </Box>
        <StatusBadge label={entry.label} tone={entry.tone} />
      </Stack>

      <Stack spacing={2.5}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 2 }}>Submission</Typography>
          <Stack spacing={1.5}>
            <Field label="Received" value={formatDateTime(lead.createdAt)} />
            <Field label="Source" value={`${lead.sourcePage} · ${lead.sourceCta}`} />
            <Field label="Locale" value={lead.locale} />
            <Field label="Device" value={lead.device} />
            {lead.comment && <Field label="Comment" value={lead.comment} multiline />}
            {lead.quizAnswers && (
              <Field
                label="Quiz answers"
                value={Object.entries(lead.quizAnswers)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join('\n')}
                multiline
              />
            )}
          </Stack>
        </Paper>

        {filledAboutFields.length > 0 && (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 2 }}>About</Typography>
            <Stack spacing={1.5}>
              {filledAboutFields.map(([label, value]) => (
                <Field key={label} label={label} value={value!} />
              ))}
            </Stack>
          </Paper>
        )}

        {lead.meetingFormat && (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 2 }}>Dealer meeting</Typography>
            <Stack spacing={1.5}>
              <Field
                label="When"
                value={lead.meetingAt ? formatDateTime(lead.meetingAt) : 'No time set'}
              />
              <Field
                label="Format"
                value={MEETING_FORMAT_LABEL[lead.meetingFormat] ?? lead.meetingFormat}
              />
              {meetingWhere && (
                <Field
                  label={lead.meetingFormat === 'OFFICE' ? 'Branch' : 'Address'}
                  value={meetingWhere}
                />
              )}
            </Stack>
          </Paper>
        )}

        {isDealerLead && (canConvertToPartner || lead.convertedPartnerId) && (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 2 }}>Partner</Typography>
            {lead.convertedPartnerId ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <StatusBadge label="Converted" tone="live" />
                <Button component={RouterLink} to="/partners" size="small">
                  View in Partners
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  Creates a Partner record from this lead's name, company and phone, plus a portal
                  login with the Partner role.
                </Typography>
                <Box>
                  <Button variant="contained" size="small" onClick={() => setConverting(true)}>
                    Convert to partner
                  </Button>
                </Box>
              </Stack>
            )}
          </Paper>
        )}

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 2 }}>Status &amp; notes</Typography>
          <Stack spacing={2}>
            <TextField
              label="Status"
              value={lead.status}
              onChange={(event) => statusMutation.mutate(event.target.value as LeadStatus)}
              select
              size="small"
              disabled={!canUpdate || statusMutation.isPending}
              sx={{ maxWidth: 220 }}
            >
              {STATUSES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Internal notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              multiline
              minRows={3}
              disabled={!canUpdate}
              helperText="Visible to staff only — never shown to the visitor."
            />

            {canUpdate && (
              <Box>
                <Button
                  variant="contained"
                  size="small"
                  disabled={notesMutation.isPending || notes === (lead.notes ?? '')}
                  onClick={() => notesMutation.mutate()}
                >
                  Save notes
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>

        {canDelete && (
          <Box>
            <Button color="error" variant="outlined" onClick={() => setDeleting(true)}>
              Delete lead
            </Button>
          </Box>
        )}
      </Stack>

      <ConfirmDialog
        open={deleting}
        title="Delete this lead?"
        message={`${lead.name}'s submission is permanently removed.`}
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setDeleting(false)}
      />

      {converting && (
        <ConvertToPartnerDialog
          lead={lead}
          onClose={() => setConverting(false)}
          onDone={(message) => {
            setConverting(false);
            toast(message);
            refresh();
          }}
        />
      )}
    </Box>
  );
}

/**
 * Mirrors `PartnersPage`'s `AccountDialog` almost exactly — same
 * reveal-once temporary password, same "email is the only thing you type"
 * shape — since this creates exactly that kind of account, just pre-filled
 * from a lead instead of an existing partner record.
 */
function ConvertToPartnerDialog({
  lead,
  onClose,
  onDone,
}: {
  lead: Lead;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState(lead.email ?? '');
  const [error, setError] = useState<string | null>(null);
  /** Set once creation succeeds — switches the dialog to the reveal-once view. */
  const [issued, setIssued] = useState<string | null>(null);
  const doneMessage = `${lead.name} was added as a partner.`;

  const mutation = useMutation({
    mutationFn: () => api.leads.convertToPartner(lead.id, { email, name: lead.name }),
    onSuccess: (created) => setIssued(created.temporaryPassword),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function copyPassword() {
    if (!issued) return;
    void navigator.clipboard.writeText(issued).then(() => toast('Copied.'));
  }

  return (
    <Dialog
      open
      onClose={mutation.isPending ? undefined : issued ? () => onDone(doneMessage) : onClose}
      maxWidth="xs"
      fullWidth
    >
      {issued ? (
        <>
          <DialogTitle>Partner created</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '0.875rem', mb: 3 }}>
              Send this password to {lead.name} outside the panel — it is shown only this once. They
              will be asked to set their own the moment they sign in.
            </DialogContentText>
            <TextField
              label="Temporary password"
              value={issued}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { fontFamily: mono },
                  endAdornment: (
                    <IconButton onClick={copyPassword} edge="end" size="small" aria-label="Copy">
                      <ContentCopyOutlined fontSize="small" />
                    </IconButton>
                  ),
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button variant="contained" onClick={() => onDone(doneMessage)}>
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            mutation.mutate();
          }}
        >
          <DialogTitle>Convert to partner</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '0.875rem', mb: 3 }}>
              Creates a Partner named &ldquo;{lead.name}&rdquo;
              {lead.company ? ` (${lead.company})` : ''} with a portal login. A temporary password
              is generated for you to pass on — no email is sent.
            </DialogContentText>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Login email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!email || mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create partner'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>
        {value}
      </Typography>
    </Box>
  );
}
