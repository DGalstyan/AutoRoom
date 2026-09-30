import type { OrderUpdateInput } from '@autoroom/api/client';
import {
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { INSPECTION_STATUSES } from '@/pages/orders/orderOptions';

/** `OrderUpdateInput.purchaseDate`/`paidDate` are ISO datetimes; an HTML
 * `<input type="date">` speaks plain `YYYY-MM-DD` — these convert between
 * the two without pulling in a date-picker dependency for two fields. */
function toDateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}
function fromDateInputValue(value: string): string | null {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}

/**
 * Everything on the partner-facing "Cars inner page" (Figma node `431:633`)
 * beyond the original container/ship/tracking fields already in
 * `OrderDetailPage`'s "Delivery data" card. Purely presentational — reads
 * and writes the same `draft`/`setDraft` state that card's own Save button
 * submits, since `PUT /orders/:id` replaces the whole record rather than
 * patching a subset.
 */
export function LogisticsFields({
  draft,
  setDraft,
  disabled,
}: {
  draft: OrderUpdateInput;
  setDraft: (next: OrderUpdateInput) => void;
  disabled: boolean;
}) {
  function set<K extends keyof OrderUpdateInput>(key: K, value: OrderUpdateInput[K]) {
    setDraft({ ...draft, [key]: value });
  }

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Sale origin
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Sale origin"
            placeholder="e.g. Auction IAAI Baltimore, MD"
            value={draft.saleOrigin ?? ''}
            onChange={(event) => set('saleOrigin', event.target.value || null)}
            fullWidth
            disabled={disabled}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Purchase date"
              type="date"
              value={toDateInputValue(draft.purchaseDate)}
              onChange={(event) => set('purchaseDate', fromDateInputValue(event.target.value))}
              fullWidth
              disabled={disabled}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Paid date"
              type="date"
              value={toDateInputValue(draft.paidDate)}
              onChange={(event) => set('paidDate', fromDateInputValue(event.target.value))}
              fullWidth
              disabled={disabled}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          <TextField
            label="Seller"
            value={draft.seller ?? ''}
            onChange={(event) => set('seller', event.target.value || null)}
            fullWidth
            disabled={disabled}
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Delivery
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Delivery branch"
            value={draft.deliveryBranch ?? ''}
            onChange={(event) => set('deliveryBranch', event.target.value || null)}
            fullWidth
            disabled={disabled}
          />
          <FormControlLabel
            control={
              <Switch
                checked={draft.truckingRequired ?? false}
                onChange={(event) => set('truckingRequired', event.target.checked)}
                disabled={disabled}
              />
            }
            label="Trucking required"
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Exporter &amp; receiver
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Exporter"
            value={draft.exporter ?? ''}
            onChange={(event) => set('exporter', event.target.value || null)}
            fullWidth
            disabled={disabled}
          />
          <TextField
            label="Consignee"
            value={draft.consignee ?? ''}
            onChange={(event) => set('consignee', event.target.value || null)}
            fullWidth
            disabled={disabled}
          />
          <TextField
            label="Receiving agent"
            value={draft.receivingAgent ?? ''}
            onChange={(event) => set('receivingAgent', event.target.value || null)}
            fullWidth
            disabled={disabled}
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Shipping
        </Typography>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={draft.consolidate ?? false}
                onChange={(event) => set('consolidate', event.target.checked)}
                disabled={disabled}
              />
            }
            label="Consolidated with other shipments"
          />
          <TextField
            label="Final destination"
            value={draft.finalDestination ?? ''}
            onChange={(event) => set('finalDestination', event.target.value || null)}
            fullWidth
            disabled={disabled}
          />
          <TextField
            label="Shipping line"
            value={draft.shippingLine ?? ''}
            onChange={(event) => set('shippingLine', event.target.value || null)}
            fullWidth
            disabled={disabled}
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Commodity &amp; inspection
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Color"
              value={draft.color ?? ''}
              onChange={(event) => set('color', event.target.value || null)}
              fullWidth
              disabled={disabled}
            />
            <TextField
              label="Ocean/flight cargo type"
              placeholder="e.g. 4 cars/Cont"
              value={draft.oceanCargoType ?? ''}
              onChange={(event) => set('oceanCargoType', event.target.value || null)}
              fullWidth
              disabled={disabled}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Buyer code"
              value={draft.buyerCode ?? ''}
              onChange={(event) => set('buyerCode', event.target.value || null)}
              fullWidth
              disabled={disabled}
            />
            <TextField
              label="Gate pass ID / pickup PIN"
              value={draft.gatePassId ?? ''}
              onChange={(event) => set('gatePassId', event.target.value || null)}
              fullWidth
              disabled={disabled}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            <TextField
              label="Inspection status"
              select
              value={draft.inspectionStatus ?? 'PENDING'}
              onChange={(event) =>
                set('inspectionStatus', event.target.value as OrderUpdateInput['inspectionStatus'])
              }
              fullWidth
              disabled={disabled}
            >
              {INSPECTION_STATUSES.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={draft.hasKeys ?? false}
                  onChange={(event) => set('hasKeys', event.target.checked)}
                  disabled={disabled}
                />
              }
              label="Keys included"
              sx={{ flex: 'none', whiteSpace: 'nowrap' }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Insurance
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2 }}>
          Drives the "not protected" warning the partner sees on this order.
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={draft.insured ?? false}
              onChange={(event) => set('insured', event.target.checked)}
              disabled={disabled}
            />
          }
          label="This shipment has cargo insurance"
        />
      </Paper>
    </Stack>
  );
}
