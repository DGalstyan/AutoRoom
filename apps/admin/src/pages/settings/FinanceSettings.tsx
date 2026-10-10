import type { SettingRecord } from '@autoroom/api/client';
import { FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import { SectionCard } from '@/pages/settings/SectionCard';
import { useSettingSection } from '@/pages/settings/useSettingSection';

/**
 * Drives the public `LoanCalculator` on China/USA car-detail pages — the
 * numbers here (term, rates, down-payment bounds, USD→AMD rate) are exactly
 * what a car's monthly payment is computed from, so changing a rate here is
 * the only way to update it site-wide without a deploy.
 */
export function FinanceSettings({
  records,
  readOnly,
}: {
  records: SettingRecord[] | undefined;
  readOnly: boolean;
}) {
  const finance = useSettingSection('finance.calculator', records);
  const customs = useSettingSection('finance.customs', records);
  if (!finance.value || !customs.value) return null;
  const c = customs.value;
  const num = (raw: string) => (raw === '' ? null : Number(raw));
  const AGES = [
    ['under3', 'Under 3 years'],
    ['between3And5', '3–5 years'],
    ['between5And10', '5–10 years'],
    ['over10', 'Over 10 years'],
  ] as const;
  const v = finance.value;

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
      <SectionCard
        title="Loan calculator"
        description="Feeds the real-time monthly-payment calculator on every car detail page."
        dirty={finance.dirty}
        saving={finance.saving}
        readOnly={readOnly}
        onSave={finance.save}
        onSaveAsync={finance.saveAsync}
        onReset={finance.reset}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Term (months)"
              type="number"
              value={v.termMonths}
              onChange={(event) => finance.patch({ termMonths: Number(event.target.value) })}
              error={Boolean(finance.fieldErrors.termMonths)}
              helperText={finance.fieldErrors.termMonths}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="USD → AMD rate"
              type="number"
              value={v.usdToAmd}
              onChange={(event) => finance.patch({ usdToAmd: Number(event.target.value) })}
              error={Boolean(finance.fieldErrors.usdToAmd)}
              helperText={finance.fieldErrors.usdToAmd}
              disabled={readOnly}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Nominal rate (%)"
              type="number"
              value={v.nominalRate}
              onChange={(event) => finance.patch({ nominalRate: Number(event.target.value) })}
              error={Boolean(finance.fieldErrors.nominalRate)}
              helperText={finance.fieldErrors.nominalRate}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Effective rate min (%)"
              type="number"
              value={v.effectiveRateMin}
              onChange={(event) => finance.patch({ effectiveRateMin: Number(event.target.value) })}
              error={Boolean(finance.fieldErrors.effectiveRateMin)}
              helperText={finance.fieldErrors.effectiveRateMin}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Effective rate max (%)"
              type="number"
              value={v.effectiveRateMax}
              onChange={(event) => finance.patch({ effectiveRateMax: Number(event.target.value) })}
              error={Boolean(finance.fieldErrors.effectiveRateMax)}
              helperText={finance.fieldErrors.effectiveRateMax}
              disabled={readOnly}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Min down payment (%)"
              type="number"
              value={Math.round(v.minDownPaymentRatio * 100)}
              onChange={(event) =>
                finance.patch({ minDownPaymentRatio: Number(event.target.value) / 100 })
              }
              error={Boolean(finance.fieldErrors.minDownPaymentRatio)}
              helperText={finance.fieldErrors.minDownPaymentRatio}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Default down payment (%)"
              type="number"
              value={Math.round(v.defaultDownPaymentRatio * 100)}
              onChange={(event) =>
                finance.patch({ defaultDownPaymentRatio: Number(event.target.value) / 100 })
              }
              error={Boolean(finance.fieldErrors.defaultDownPaymentRatio)}
              helperText={finance.fieldErrors.defaultDownPaymentRatio}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Max down payment (%)"
              type="number"
              value={Math.round(v.maxDownPaymentRatio * 100)}
              onChange={(event) =>
                finance.patch({ maxDownPaymentRatio: Number(event.target.value) / 100 })
              }
              error={Boolean(finance.fieldErrors.maxDownPaymentRatio)}
              helperText={finance.fieldErrors.maxDownPaymentRatio}
              disabled={readOnly}
              fullWidth
            />
          </Stack>

          <TextField
            label="Disclaimer"
            value={v.disclaimer ?? ''}
            onChange={(event) => finance.patch({ disclaimer: event.target.value || null })}
            error={Boolean(finance.fieldErrors.disclaimer)}
            helperText={
              finance.fieldErrors.disclaimer ??
              'Small print under the monthly payment, e.g. "Rate includes KASKO insurance."'
            }
            disabled={readOnly}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </SectionCard>

      <SectionCard
        title="Customs calculator"
        description="Feeds the USA customs calculator. Enter the current legal figures: the site ships none of its own. While a rate is blank, visitors see the part that can be worked out and are handed to a specialist for the rest."
        dirty={customs.dirty}
        saving={customs.saving}
        readOnly={readOnly}
        onSave={customs.save}
        onSaveAsync={customs.saveAsync}
        onReset={customs.reset}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="USD → AMD rate (customs)"
              type="number"
              value={c.usdToAmd ?? ''}
              onChange={(event) => customs.patch({ usdToAmd: num(event.target.value) })}
              error={Boolean(customs.fieldErrors.usdToAmd)}
              helperText={customs.fieldErrors.usdToAmd ?? 'Blank = use the loan calculator rate.'}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Rate date"
              type="date"
              value={c.rateDate ?? ''}
              onChange={(event) => customs.patch({ rateDate: event.target.value || null })}
              error={Boolean(customs.fieldErrors.rateDate)}
              helperText={customs.fieldErrors.rateDate ?? 'The day the rate applies.'}
              disabled={readOnly}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Rate source"
            value={c.rateSource ?? ''}
            onChange={(event) => customs.patch({ rateSource: event.target.value || null })}
            error={Boolean(customs.fieldErrors.rateSource)}
            helperText={customs.fieldErrors.rateSource ?? 'Shown next to the rate, e.g. “ՀՀ ԿԲ”.'}
            disabled={readOnly}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Customs duty (%)"
              type="number"
              value={c.dutyPercent ?? ''}
              onChange={(event) => customs.patch({ dutyPercent: num(event.target.value) })}
              error={Boolean(customs.fieldErrors.dutyPercent)}
              helperText={customs.fieldErrors.dutyPercent}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="VAT (%)"
              type="number"
              value={c.vatPercent ?? ''}
              onChange={(event) => customs.patch({ vatPercent: num(event.target.value) })}
              error={Boolean(customs.fieldErrors.vatPercent)}
              helperText={customs.fieldErrors.vatPercent}
              disabled={readOnly}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {AGES.map(([key, label]) => (
              <TextField
                key={key}
                label={`Excise, AMD per cm³ — ${label}`}
                type="number"
                value={c.exciseAmdPerCm3[key] ?? ''}
                onChange={(event) =>
                  customs.patch({
                    exciseAmdPerCm3: { ...c.exciseAmdPerCm3, [key]: num(event.target.value) },
                  })
                }
                error={Boolean(customs.fieldErrors[`exciseAmdPerCm3.${key}`])}
                helperText={customs.fieldErrors[`exciseAmdPerCm3.${key}`]}
                disabled={readOnly}
                sx={{ flex: '1 1 280px' }}
              />
            ))}
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={c.evExempt}
                onChange={(event) => customs.patch({ evExempt: event.target.checked })}
                disabled={readOnly}
              />
            }
            label="Electric vehicles pay no duty or excise (VAT still applies)"
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}
