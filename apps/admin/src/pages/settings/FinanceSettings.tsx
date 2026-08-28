import type { SettingRecord } from '@autoroom/api/client';
import { Stack, TextField } from '@mui/material';
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
  if (!finance.value) return null;
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
    </Stack>
  );
}
