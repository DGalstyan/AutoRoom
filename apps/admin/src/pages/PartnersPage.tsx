import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Partner, PartnerInput } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { brand, mono } from '@/theme';

const BLANK: PartnerInput = {
  name: '',
  company: null,
  phone: null,
  email: null,
  notes: null,
  active: true,
};

/**
 * Dealers and agents, and the portal logins they sign in with.
 *
 * A partner exists in the CRM whether or not anyone has given them access, so
 * the record and the account are created separately — revoking a login should
 * not delete the relationship, and adding one should not be a precondition for
 * tracking them.
 */
export function PartnersPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; partner: Partner } | null>(null);
  const [editing, setEditing] = useState<{ partner?: Partner } | null>(null);
  const [account, setAccount] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState<Partner | null>(null);

  const canCreate = identity?.permissions.includes('partners:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('partners:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('partners:DELETE') ?? false;
  // The catalogue is where the entry leads, so its permission is what gates it.
  const canReadCars = identity?.permissions.includes('cars:READ') ?? false;
  const canCreateUsers = identity?.permissions.includes('users:CREATE') ?? false;

  const partnersQuery = useQuery({
    queryKey: ['partners', search],
    queryFn: () => api.partners.list({ search: search || undefined, take: 100 }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['partners'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.partners.remove(id),
    onSuccess: () => {
      toast('Partner deleted.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const partners = partnersQuery.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Partners
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Dealers and agents, the cars assigned to them, and their portal access.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing({})}
            sx={{ flex: 'none' }}
          >
            Add partner
          </Button>
        )}
      </Stack>

      <DataTable
        rows={partners}
        getRowId={(partner) => partner.id}
        isPending={partnersQuery.isPending}
        error={partnersQuery.isError ? partnersQuery.error : undefined}
        errorMessage="Could not load partners."
        emptyMessage="No partners match this search."
        minWidth={820}
        toolbar={
          <TextField
            label="Search"
            placeholder="Name, company or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
            sx={{ minWidth: 260 }}
          />
        }
        columns={[
          {
            key: 'partner',
            header: 'Partner',
            render: (partner) => (
              <>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {partner.name}
                </Typography>
                {partner.company && (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {partner.company}
                  </Typography>
                )}
              </>
            ),
          },
          {
            key: 'contact',
            header: 'Contact',
            render: (partner) => (
              <Box sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                {partner.email ?? '—'}
                {partner.phone && (
                  <Typography sx={{ fontFamily: mono, fontSize: '0.75rem' }}>
                    {partner.phone}
                  </Typography>
                )}
              </Box>
            ),
          },
          {
            key: 'cars',
            header: 'Cars',
            align: 'center',
            render: (partner) =>
              // The count is the natural place to ask "which ones?", so it is
              // the link rather than a separate action.
              partner.carCount > 0 ? (
                <Typography
                  component={RouterLink}
                  to={`/cars?partnerId=${partner.id}`}
                  aria-label={`View the ${partner.carCount} cars assigned to ${partner.name}`}
                  sx={{
                    fontSize: '0.875rem',
                    color: 'inherit',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    textDecorationColor: brand.lineLight,
                    '&:hover': { textDecorationColor: 'inherit' },
                  }}
                >
                  {partner.carCount}
                </Typography>
              ) : (
                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>0</Typography>
              ),
          },
          {
            key: 'bookings',
            header: 'Bookings',
            align: 'center',
            render: (partner) => (
              <Typography sx={{ fontSize: '0.875rem' }}>{partner.bookingCount}</Typography>
            ),
          },
          {
            key: 'portal',
            header: 'Portal access',
            render: (partner) =>
              partner.account ? (
                <Box>
                  <StatusBadge
                    label={partner.active ? 'Active' : 'Suspended'}
                    tone={partner.active ? 'live' : 'pending'}
                  />
                  <Typography
                    sx={{ fontFamily: mono, fontSize: '0.6875rem', color: 'text.secondary' }}
                  >
                    {partner.account.email}
                  </Typography>
                </Box>
              ) : (
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                  No login
                </Typography>
              ),
          },
          {
            key: 'actions',
            align: 'right',
            hidden: !canUpdate && !canDelete && !canReadCars,
            render: (partner) => (
              <IconButton
                size="small"
                aria-label={`Actions for ${partner.name}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, partner })}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            ),
          },
        ]}
      />

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {/*
          Goes to the catalogue filtered to this partner rather than opening a
          list of its own: it is the same set of cars, and a second listing
          would need its own search, sort and paging to stay usable. Shown even
          at zero, where the empty catalogue reads "no cars match these
          filters" — a disabled entry would leave "how many?" unanswered.
        */}
        {canReadCars && menu && (
          <MenuItem
            onClick={() => {
              navigate(`/cars?partnerId=${menu.partner.id}`);
              setMenu(null);
            }}
          >
            {menu.partner.carCount === 1 ? 'View 1 car' : `View ${menu.partner.carCount} cars`}
          </MenuItem>
        )}
        {canUpdate && (
          <MenuItem
            onClick={() => {
              if (menu) setEditing({ partner: menu.partner });
              setMenu(null);
            }}
          >
            Edit details
          </MenuItem>
        )}
        {canUpdate && canCreateUsers && menu && !menu.partner.account && (
          <MenuItem
            onClick={() => {
              setAccount(menu.partner);
              setMenu(null);
            }}
          >
            Give portal access
          </MenuItem>
        )}
        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.partner);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <PartnerDialog
          partner={editing.partner}
          onClose={() => setEditing(null)}
          onDone={(message) => {
            setEditing(null);
            toast(message);
            void refresh();
          }}
        />
      )}

      {account && (
        <AccountDialog
          partner={account}
          onClose={() => setAccount(null)}
          onDone={(message) => {
            setAccount(null);
            toast(message);
            void refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this partner?"
        message={
          deleting
            ? `${deleting.name} and their ${deleting.bookingCount} booking(s) will be removed, and their portal login stops working. Their ${deleting.carCount} car(s) stay in the catalogue, unassigned.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}

function PartnerDialog({
  partner,
  onClose,
  onDone,
}: {
  partner?: Partner;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const [draft, setDraft] = useState<PartnerInput>(
    partner
      ? {
          name: partner.name,
          company: partner.company,
          phone: partner.phone,
          email: partner.email,
          notes: partner.notes,
          active: partner.active,
        }
      : BLANK,
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      partner ? api.partners.update(partner.id, draft) : api.partners.create(draft),
    onSuccess: (saved) => onDone(`${saved.name} saved.`),
    onError: (caught) => setError(errorMessage(caught)),
  });

  function set<K extends keyof PartnerInput>(key: K, value: PartnerInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogTitle>{partner ? 'Edit partner' : 'Add partner'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Name"
              value={draft.name}
              onChange={(event) => set('name', event.target.value)}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Company"
              value={draft.company ?? ''}
              onChange={(event) => set('company', event.target.value || null)}
              fullWidth
            />
            <TextField
              label="Phone"
              value={draft.phone ?? ''}
              onChange={(event) => set('phone', event.target.value || null)}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={draft.email ?? ''}
              onChange={(event) => set('email', event.target.value || null)}
              fullWidth
            />
            <TextField
              label="Notes"
              value={draft.notes ?? ''}
              onChange={(event) => set('notes', event.target.value || null)}
              multiline
              minRows={2}
              fullWidth
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Switch
                checked={draft.active}
                onChange={(event) => set('active', event.target.checked)}
              />
              <Box>
                <Typography sx={{ fontSize: '0.875rem' }}>Portal access active</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  Switching off signs them out immediately.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!draft.name || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function AccountDialog({
  partner,
  onClose,
  onDone,
}: {
  partner: Partner;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState(partner.email ?? '');
  const [error, setError] = useState<string | null>(null);
  /** Set once creation succeeds — switches the dialog to the reveal-once view. */
  const [issued, setIssued] = useState<string | null>(null);
  const doneMessage = `${partner.name} can now sign in to the portal.`;

  const mutation = useMutation({
    mutationFn: () => api.partners.createAccount(partner.id, { email }),
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
          <DialogTitle>Portal login created</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '0.875rem', mb: 3 }}>
              Send this password to {partner.name} outside the panel — it is shown only this once.
              They will be asked to set their own the moment they sign in.
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
          <DialogTitle>Give portal access</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '0.875rem', mb: 3 }}>
              Creates a login with the Partner role. They will see the cars assigned to them and
              their bookings, and nothing else. A temporary password is generated for you to pass on
              — no email is sent.
            </DialogContentText>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email"
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
              {mutation.isPending ? 'Creating…' : 'Create login'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}
