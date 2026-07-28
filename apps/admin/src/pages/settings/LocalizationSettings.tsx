import type { Locale, SettingRecord } from '@autoroom/api/client';
import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SectionCard } from '@/pages/settings/SectionCard';
import { useSettingSection } from '@/pages/settings/useSettingSection';

const LOCALES: { code: Locale; label: string; note?: string }[] = [
  { code: 'hy', label: 'Armenian — Հայերեն', note: 'The site is written in Armenian.' },
  { code: 'ru', label: 'Russian — Русский' },
  { code: 'en', label: 'English' },
];

export function LocalizationSettings({
  records,
  readOnly,
}: {
  records: SettingRecord[] | undefined;
  readOnly: boolean;
}) {
  const localization = useSettingSection('localization.locales', records);
  if (!localization.value) return null;

  const { defaultLocale, enabledLocales } = localization.value;

  function toggleLocale(code: Locale, checked: boolean) {
    const next = checked
      ? [...enabledLocales, code]
      : enabledLocales.filter((locale) => locale !== code);
    localization.patch({ enabledLocales: next });
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <SectionCard
        title="Languages"
        description="Which languages the public site offers, and which one it opens in."
        dirty={localization.dirty}
        saving={localization.saving}
        readOnly={readOnly}
        onSave={localization.save}
        onReset={localization.reset}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
            >
              Enabled
            </Typography>
            <Stack>
              {LOCALES.map((locale) => {
                const checked = enabledLocales.includes(locale.code);
                // The default language cannot be switched off — the API rejects
                // that pair, so the checkbox says no before the save does.
                const isDefault = locale.code === defaultLocale;
                return (
                  <Box key={locale.code}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked}
                          disabled={readOnly || (isDefault && checked)}
                          onChange={(event) => toggleLocale(locale.code, event.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontSize: '0.9375rem' }}>
                            {locale.label}
                            {isDefault && (
                              <Typography
                                component="span"
                                sx={{ color: 'text.secondary', fontSize: '0.8125rem', ml: 1 }}
                              >
                                default
                              </Typography>
                            )}
                          </Typography>
                          {locale.note && (
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              {locale.note}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </Box>
                );
              })}
            </Stack>
            {localization.fieldErrors.enabledLocales && (
              <Typography sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                {localization.fieldErrors.enabledLocales}
              </Typography>
            )}
          </Box>

          <TextField
            label="Default language"
            value={defaultLocale}
            onChange={(event) => {
              const next = event.target.value as Locale;
              // Selecting a disabled language enables it, rather than saving a
              // pair the API will refuse.
              localization.setValue({
                defaultLocale: next,
                enabledLocales: enabledLocales.includes(next)
                  ? enabledLocales
                  : [...enabledLocales, next],
              });
            }}
            select
            disabled={readOnly}
            error={Boolean(localization.fieldErrors.defaultLocale)}
            helperText={
              localization.fieldErrors.defaultLocale ??
              'The language the site opens in for a visitor with no preference.'
            }
            sx={{ maxWidth: 320 }}
          >
            {LOCALES.map((locale) => (
              <MenuItem key={locale.code} value={locale.code}>
                {locale.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </SectionCard>
    </Box>
  );
}
