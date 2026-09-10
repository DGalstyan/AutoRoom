import { useState } from 'react';
import type { Locale, PriceChip } from '@autoroom/api/client';
import { Alert, Box, Button, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { formatMoney } from '@/pages/cars/carOptions';
import { brand } from '@/theme';

/** The site's languages, in the order the editor offers them — same list and
 * order as `FaqDialog`'s `LANGUAGES`, for the same reason: Armenian is the
 * site's default and only guaranteed-enabled locale, Russian and English are
 * translations. */
const LANGUAGES: { value: Locale; label: string; required?: boolean }[] = [
  { value: 'hy', label: 'Armenian', required: true },
  { value: 'ru', label: 'Russian' },
  { value: 'en', label: 'English' },
];

const EMPTY: PriceChip[] = [
  { label: { hy: 'Մեքենայի արժեքը' }, amount: 0, note: null },
  { label: { hy: 'Լոգիստիկա և առաքում' }, amount: 0, note: null },
  { label: { hy: 'Մաքսազերծում' }, amount: 0, note: null },
  { label: { hy: 'Ընդհանուր արժեքը Հայաստանում' }, amount: 0, note: null },
];

/**
 * The four price-breakdown chips.
 *
 * Four or none — the public component lays out exactly four, so a fifth would
 * be dropped silently and a third would leave a hole. Rather than let someone
 * build an invalid set and discover it at save time, the editor only offers
 * "add all four" or "clear", and the API enforces the same rule.
 *
 * Each chip's label/note is per-locale (`PriceChip.label`/`note` are
 * `LocalizedText`, the same shape `Faq.question`/`answer` use), so the public
 * site can show the visitor's own language instead of whatever the admin
 * happened to type. One shared language-tab selector drives all four chips at
 * once — mirrors `FaqDialog`'s single `language` state — rather than four
 * separate tab strips, since switching languages to review or translate a
 * whole breakdown is the actual workflow here.
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
  const [language, setLanguage] = useState<Locale>('hy');

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

  function updateLabel(index: number, value: string) {
    const chip = chips[index];
    if (!chip) return;
    update(index, { label: { ...chip.label, [language]: value } });
  }

  function updateNote(index: number, value: string) {
    const chip = chips[index];
    if (!chip) return;
    const next = { ...(chip.note ?? {}), [language]: value || undefined };
    // Empty in every language means "no note", the same collapsing rule the
    // API applies — storing `{}` here would round-trip as a note nobody wrote.
    const hasText = Boolean(next.hy || next.ru || next.en);
    update(index, { note: hasText ? next : null });
  }

  // The last chip is the total, so flagging the mismatch is the whole point of
  // showing a sum — it is the error someone actually makes here.
  const partsTotal = chips.slice(0, 3).reduce((sum, chip) => sum + (chip.amount || 0), 0);
  const stated = chips[3]?.amount ?? 0;
  const mismatch = stated !== 0 && partsTotal !== 0 && stated !== partsTotal;

  return (
    <Stack spacing={2}>
      <Tabs
        value={language}
        onChange={(_event, value: Locale) => setLanguage(value)}
        variant="fullWidth"
        sx={{ minHeight: 38, maxWidth: 420 }}
      >
        {LANGUAGES.map((entry) => (
          <Tab
            key={entry.value}
            value={entry.value}
            label={entry.required ? `${entry.label} *` : entry.label}
            sx={{ minHeight: 38 }}
          />
        ))}
      </Tabs>

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
            value={chip.label[language] ?? ''}
            onChange={(event) => updateLabel(index, event.target.value)}
            disabled={readOnly}
            size="small"
            helperText={language !== 'hy' ? 'Leave empty to keep untranslated.' : undefined}
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
            value={chip.note?.[language] ?? ''}
            onChange={(event) => updateNote(index, event.target.value)}
            disabled={readOnly}
            size="small"
            helperText={language !== 'hy' ? 'Leave empty to keep untranslated.' : undefined}
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
