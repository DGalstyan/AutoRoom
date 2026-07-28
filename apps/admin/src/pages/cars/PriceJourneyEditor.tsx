import type { PriceChip } from '@autoroom/api/client';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { formatMoney } from '@/pages/cars/carOptions';
import { brand } from '@/theme';

const EMPTY: PriceChip[] = [
  { label: 'Car price', amount: 0, note: null },
  { label: 'Shipping', amount: 0, note: null },
  { label: 'Customs', amount: 0, note: null },
  { label: 'Total in Armenia', amount: 0, note: null },
];

/**
 * The four price-breakdown chips.
 *
 * Four or none — the public component lays out exactly four, so a fifth would
 * be dropped silently and a third would leave a hole. Rather than let someone
 * build an invalid set and discover it at save time, the editor only offers
 * "add all four" or "clear", and the API enforces the same rule.
 */
export function PriceJourneyEditor({
  chips,
  onChange,
  readOnly,
}: {
  chips: PriceChip[];
  onChange: (chips: PriceChip[]) => void;
  readOnly: boolean;
}) {
  if (chips.length === 0) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          No breakdown shown on the car page.
        </Typography>
        {!readOnly && (
          <Button onClick={() => onChange(EMPTY)} variant="outlined" size="small">
            Add the four chips
          </Button>
        )}
      </Stack>
    );
  }

  function update(index: number, changes: Partial<PriceChip>) {
    onChange(chips.map((chip, i) => (i === index ? { ...chip, ...changes } : chip)));
  }

  // The last chip is the total, so flagging the mismatch is the whole point of
  // showing a sum — it is the error someone actually makes here.
  const partsTotal = chips.slice(0, 3).reduce((sum, chip) => sum + (chip.amount || 0), 0);
  const stated = chips[3]?.amount ?? 0;
  const mismatch = stated !== 0 && partsTotal !== 0 && stated !== partsTotal;

  return (
    <Stack spacing={2}>
      {chips.map((chip, index) => (
        <Stack
          key={index}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <Box
            aria-hidden
            sx={{
              width: 24,
              height: 24,
              flex: 'none',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: index === 3 ? brand.ink : brand.surfaceLight,
              color: index === 3 ? brand.paper : brand.muted,
              fontSize: '0.6875rem',
              fontWeight: 700,
            }}
          >
            {index + 1}
          </Box>
          <TextField
            label="Label"
            value={chip.label}
            onChange={(event) => update(index, { label: event.target.value })}
            disabled={readOnly}
            size="small"
            sx={{ flex: 1, minWidth: 150 }}
          />
          <TextField
            label="Amount"
            type="number"
            value={chip.amount}
            onChange={(event) => update(index, { amount: Number(event.target.value) })}
            disabled={readOnly}
            size="small"
            sx={{ width: 150 }}
          />
          <TextField
            label="Note"
            value={chip.note ?? ''}
            onChange={(event) => update(index, { note: event.target.value || null })}
            disabled={readOnly}
            size="small"
            sx={{ flex: 1, minWidth: 150 }}
          />
        </Stack>
      ))}

      {mismatch && (
        <Alert severity="warning">
          The first three add up to {formatMoney(partsTotal)}, but the total says{' '}
          {formatMoney(stated)}. Saving is still allowed — the site shows what you enter.
        </Alert>
      )}

      {!readOnly && (
        <Box>
          <Button onClick={() => onChange([])} size="small" color="inherit">
            Remove the breakdown
          </Button>
        </Box>
      )}
    </Stack>
  );
}
