import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AvailabilitySlot, AvailabilitySlotInput } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { brand, mono } from '@/theme';
import { GenerateSlotsDialog } from '@/pages/availability/GenerateSlotsDialog';
import { SlotDialog } from '@/pages/availability/SlotDialog';
import { dayKey, formatDayHeading, formatTime, toDateInput } from '@/pages/availability/time';

/**
 * The diary.
 *
 * Grouped by day rather than shown as a flat table: a slot list is read to
 * answer "what does Tuesday look like", and a table sorted by timestamp makes
 * that question harder than a wall calendar does. Each slot carries its own
 * open/taken state, which is derived server-side from the bookings holding it.
 */
export function AvailabilityPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [from, setFrom] = useState(() => toDateInput(new Date()));
  const [to, setTo] = useState(() => toDateInput(new Date(Date.now() + 27 * 86_400_000)));
  const [branchId, setBranchId] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const [editing, setEditing] = useState<{ slot?: AvailabilitySlot } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<AvailabilitySlot | null>(null);

  const canCreate = identity?.permissions.includes('availability:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('availability:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('availability:DELETE') ?? false;
  const canReadBranches = identity?.permissions.includes('branches:READ') ?? false;

  const slotsQuery = useQuery({
    queryKey: ['availability', from, to, branchId, onlyOpen],
    queryFn: () =>
      api.availability.list({
        // The inputs are calendar dates; the API wants instants, and the day
        // the user picked should be included whole.
        from: new Date(`${from}T00:00:00`).toISOString(),
        to: new Date(`${to}T23:59:59`).toISOString(),
        ...(branchId ? { branchId } : {}),
        ...(onlyOpen ? { onlyOpen: true } : {}),
        take: 500,
      }),
  });

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.branches.list(),
    enabled: canReadBranches,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['availability'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.availability.remove(id),
    onSuccess: () => {
      toast('Slot removed.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const slots = useMemo(() => slotsQuery.data?.items ?? [], [slotsQuery.data]);
  const branches = branchesQuery.data?.items ?? [];

  /** Slots bucketed by local calendar day, in the order the API returned them. */
  const days = useMemo(() => {
    const buckets = new Map<string, AvailabilitySlot[]>();
    for (const slot of slots) {
      const key = dayKey(slot.startsAt);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(slot);
      else buckets.set(key, [slot]);
    }
    return [...buckets.entries()];
  }, [slots]);

  const openCount = slots.filter((slot) => slot.open).length;

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Availability
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            The slots partners can book into. A slot closes when its bookings fill it.
          </Typography>
        </Box>

        {canCreate && (
          <Stack direction="row" spacing={1.5} sx={{ flex: 'none' }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<AutoAwesomeMotionIcon />}
              onClick={() => setGenerating(true)}
            >
              Generate
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({})}>
              Add slot
            </Button>
          </Stack>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            p: 2,
            borderBottom: `1px solid ${brand.lineLight}`,
            alignItems: { sm: 'center' },
          }}
        >
          <TextField
            label="From"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {canReadBranches && (
            <TextField
              label="Branch"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              select
              size="small"
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="">All branches</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={onlyOpen}
                onChange={(event) => setOnlyOpen(event.target.checked)}
                size="small"
              />
            }
            label="Open only"
            sx={{ ml: { sm: 'auto' }, mr: 0 }}
          />
        </Stack>

        {slotsQuery.isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
          </Box>
        ) : slotsQuery.isError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {errorMessage(slotsQuery.error, 'Could not load availability.')}
          </Alert>
        ) : days.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              No slots in this range.
              {canCreate && ' Use Generate to fill a week of opening hours in one go.'}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography
              sx={{
                px: 2.5,
                py: 1.25,
                fontFamily: mono,
                fontSize: '0.75rem',
                color: 'text.secondary',
                borderBottom: `1px solid ${brand.lineLight}`,
              }}
            >
              {slots.length} slot{slots.length === 1 ? '' : 's'} · {openCount} open ·{' '}
              {slots.length - openCount} taken
            </Typography>

            {days.map(([key, daySlots]) => (
              <Box key={key} sx={{ borderBottom: `1px solid ${brand.lineLight}`, p: 2.5 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', mb: 1.5 }}>
                  {formatDayHeading(key)}
                </Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {daySlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onEdit={canUpdate ? () => setEditing({ slot }) : undefined}
                      onDelete={canDelete ? () => setDeleting(slot) : undefined}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {editing && (
        <SlotDialog
          slot={editing.slot}
          branches={branches}
          onClose={() => setEditing(null)}
          onDone={(message) => {
            setEditing(null);
            toast(message);
            void refresh();
          }}
        />
      )}

      {generating && (
        <GenerateSlotsDialog
          branches={branches}
          defaultFrom={from}
          defaultTo={to}
          onClose={() => setGenerating(false)}
          onDone={(message) => {
            setGenerating(false);
            toast(message);
            void refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove this slot?"
        message="It will stop being offered to partners. Slots that bookings still hold cannot be removed."
        confirmLabel="Remove"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}

/**
 * One slot. The open/taken state is the loudest thing on it — that is the fact
 * someone scanning a day is actually looking for.
 */
function SlotCard({
  slot,
  onEdit,
  onDelete,
}: {
  slot: AvailabilitySlot;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const tone = slot.open ? brand.success : brand.muted;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        px: 1.5,
        py: 1.25,
        minWidth: 190,
        borderColor: slot.open ? `${brand.success}55` : brand.lineLight,
        bgcolor: slot.open ? `${brand.success}0A` : 'transparent',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <Typography sx={{ fontFamily: mono, fontSize: '0.875rem', fontWeight: 600 }}>
          {formatTime(slot.startsAt)}–{formatTime(slot.endsAt)}
        </Typography>
        <Chip
          label={slot.open ? 'Open' : 'Taken'}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: tone,
            bgcolor: `${tone}18`,
          }}
        />
      </Stack>

      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
        {slot.bookedCount}/{slot.capacity} booked
        {slot.branch ? ` · ${slot.branch.name}` : ''}
      </Typography>
      {slot.note && (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
          {slot.note}
        </Typography>
      )}

      {(onEdit || onDelete) && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, ml: -0.75 }}>
          {onEdit && (
            <Tooltip title="Edit slot">
              <IconButton size="small" onClick={onEdit} aria-label="Edit slot">
                <EditOutlinedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title={slot.bookedCount > 0 ? 'Cancel its bookings first' : 'Remove slot'}>
              {/* Wrapped: a disabled button emits no events, so the tooltip
                  explaining *why* it is disabled would never appear. */}
              <span>
                <IconButton
                  size="small"
                  onClick={onDelete}
                  disabled={slot.bookedCount > 0}
                  aria-label="Remove slot"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      )}
    </Paper>
  );
}

export type { AvailabilitySlotInput };
