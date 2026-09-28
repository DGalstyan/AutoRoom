import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order } from '@autoroom/api/client';
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage, extractFieldErrors } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { STAGES, STAGE_LABEL, STAGE_TONE } from '@/pages/orders/orderOptions';
import { brand } from '@/theme';

/** The stage timeline: current status up top, the full history below, and —
 * for anyone who can advance it — the form that does both at once. */
export function StageTimeline({ order, canAdvance }: { order: Order; canAdvance: boolean }) {
  const { api } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<(typeof STAGES)[number]['value']>(order.stage);
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.orders.advanceStage(order.id, {
        stage,
        occurredAt: new Date(occurredAt).toISOString(),
        note: note.trim() || null,
      }),
    onSuccess: () => {
      toast('Stage updated.');
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
    onError: (caught) => {
      setFieldErrors(extractFieldErrors(caught));
      setError(errorMessage(caught));
    },
  });

  const history = [...order.stages].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Shipping stage</Typography>
        <StatusBadge label={STAGE_LABEL[order.stage]} tone={STAGE_TONE[order.stage]} />
      </Stack>

      {canAdvance && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setFieldErrors({});
            mutation.mutate();
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Stage"
              value={stage}
              onChange={(event) => setStage(event.target.value as typeof stage)}
              select
              size="small"
              sx={{ minWidth: 170 }}
            >
              {STAGES.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date"
              type="date"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              size="small"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="Note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              size="small"
              sx={{ flex: 1 }}
              error={Boolean(fieldErrors.note)}
              helperText={fieldErrors.note}
            />
            <Button type="submit" variant="contained" size="small" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Advance'}
            </Button>
          </Stack>
        </form>
      )}

      {history.length === 0 ? (
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          No stage history yet.
        </Typography>
      ) : (
        <Stack spacing={0}>
          {history.map((entry, index) => (
            <Box
              key={entry.id}
              sx={{
                display: 'flex',
                gap: 1.5,
                py: 1,
                borderBottom:
                  index === history.length - 1 ? 'none' : `1px solid ${brand.lineLight}`,
              }}
            >
              <StatusBadge label={STAGE_LABEL[entry.stage]} tone={STAGE_TONE[entry.stage]} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.8125rem' }}>
                  {formatDate(entry.occurredAt)}
                </Typography>
                {entry.note && (
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                    {entry.note}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
