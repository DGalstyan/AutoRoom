import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order } from '@autoroom/api/client';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage, extractFieldErrors } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { formatMoney } from '@/pages/cars/carOptions';
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from '@/pages/orders/orderOptions';
import { brand } from '@/theme';

/** The ledger — every payment recorded against this order's car price. */
export function PaymentsPanel({
  order,
  canCreate,
  canDelete,
}: {
  order: Order;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Order['payments'][number] | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['order', order.id] });

  const removeMutation = useMutation({
    mutationFn: (paymentId: string) => api.orders.removePayment(order.id, paymentId),
    onSuccess: () => {
      toast('Payment removed.');
      setRemoving(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5">Payments</Typography>
        {canCreate && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
            Add payment
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={3} sx={{ mb: 2.5, flexWrap: 'wrap' }}>
        <Summary label="Price" value={formatMoney(order.car.price)} />
        <Summary label="Paid" value={formatMoney(order.amountPaid)} />
        <Summary label="Due" value={formatMoney(order.amountDue)} />
        <StatusBadge
          label={PAYMENT_STATUS_LABEL[order.paymentStatus]}
          tone={PAYMENT_STATUS_TONE[order.paymentStatus]}
        />
      </Stack>

      {order.payments.length === 0 ? (
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          No payments recorded yet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {order.payments.map((payment) => (
            <Stack
              key={payment.id}
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: 'center',
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${brand.lineLight}`,
              }}
            >
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {formatMoney(payment.amount)}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {formatDate(payment.paidAt)}
                  {payment.method ? ` · ${payment.method}` : ''}
                </Typography>
              </Stack>
              {canDelete && (
                <IconButton size="small" onClick={() => setRemoving(payment)} aria-label="Remove">
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Stack>
          ))}
        </Stack>
      )}

      {adding && (
        <AddPaymentDialog orderId={order.id} onClose={() => setAdding(false)} onDone={refresh} />
      )}

      {removing && (
        <ConfirmDialog
          open
          title="Remove this payment?"
          message={`${formatMoney(removing.amount)} will be removed from this order's ledger.`}
          confirmLabel="Remove"
          destructive
          busy={removeMutation.isPending}
          onConfirm={() => removeMutation.mutate(removing.id)}
          onClose={() => setRemoving(null)}
        />
      )}
    </Paper>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Stack>
      <Typography
        sx={{ fontSize: '0.6875rem', color: 'text.secondary', textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>{value}</Typography>
    </Stack>
  );
}

function AddPaymentDialog({
  orderId,
  onClose,
  onDone,
}: {
  orderId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { api } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.orders.addPayment(orderId, {
        amount: Math.round(Number(amount)),
        method: method.trim() || null,
        paidAt: new Date(paidAt).toISOString(),
      }),
    onSuccess: () => {
      onDone();
      onClose();
    },
    onError: (caught) => {
      setFieldErrors(extractFieldErrors(caught));
      setError(errorMessage(caught));
    },
  });

  const canSubmit = Number(amount) > 0 && Boolean(paidAt);

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setFieldErrors({});
          mutation.mutate();
        }}
      >
        <DialogTitle>Add payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              error={Boolean(fieldErrors.amount)}
              helperText={fieldErrors.amount}
            />
            <TextField
              label="Date"
              type="date"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(fieldErrors.paidAt)}
              helperText={fieldErrors.paidAt}
            />
            <TextField
              label="Method"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              fullWidth
              placeholder="Cash, bank transfer…"
              error={Boolean(fieldErrors.method)}
              helperText={fieldErrors.method}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
