import type { BrandingTheme, SettingRecord } from '@autoroom/api/client';
import { Box, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { SectionCard } from '@/pages/settings/SectionCard';
import { BrandPreview } from '@/pages/settings/BrandPreview';
import { useSettingSection } from '@/pages/settings/useSettingSection';

/** Grouped so the grid reads as "what it is" rather than 13 equal swatches. */
const COLOUR_GROUPS: { title: string; tokens: (keyof BrandingTheme)[] }[] = [
  { title: 'Accent', tokens: ['accent', 'accentHover'] },
  { title: 'Surfaces', tokens: ['bg', 'surface', 'surfaceLight', 'paper'] },
  { title: 'Text and lines', tokens: ['ink', 'muted', 'lineDark', 'lineLight'] },
  { title: 'Status', tokens: ['success', 'warn', 'info'] },
];

export function BrandingSettings({
  records,
  readOnly,
}: {
  records: SettingRecord[] | undefined;
  readOnly: boolean;
}) {
  const identity = useSettingSection('branding.identity', records);
  const theme = useSettingSection('branding.theme', records);
  const typography = useSettingSection('branding.typography', records);

  if (!identity.value || !theme.value || !typography.value) return null;

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ alignItems: 'flex-start' }}>
      <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <SectionCard
          title="Identity"
          description="The brand name and marks the site renders. Assets are referenced by URL — the panel has no uploader yet."
          dirty={identity.dirty}
          saving={identity.saving}
          readOnly={readOnly}
          onSave={identity.save}
          onReset={identity.reset}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Brand name"
              value={identity.value.brandName}
              onChange={(event) => identity.patch({ brandName: event.target.value })}
              error={Boolean(identity.fieldErrors.brandName)}
              helperText={identity.fieldErrors.brandName}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Logo — light backgrounds"
              value={identity.value.logoLightUrl ?? ''}
              onChange={(event) => identity.patch({ logoLightUrl: event.target.value || null })}
              error={Boolean(identity.fieldErrors.logoLightUrl)}
              helperText={
                identity.fieldErrors.logoLightUrl ?? 'Full URL. Leave blank to use the wordmark.'
              }
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Logo — dark backgrounds"
              value={identity.value.logoDarkUrl ?? ''}
              onChange={(event) => identity.patch({ logoDarkUrl: event.target.value || null })}
              error={Boolean(identity.fieldErrors.logoDarkUrl)}
              helperText={identity.fieldErrors.logoDarkUrl}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Favicon"
              value={identity.value.faviconUrl ?? ''}
              onChange={(event) => identity.patch({ faviconUrl: event.target.value || null })}
              error={Boolean(identity.fieldErrors.faviconUrl)}
              helperText={identity.fieldErrors.faviconUrl}
              disabled={readOnly}
              fullWidth
            />
          </Stack>
        </SectionCard>

        <SectionCard
          title="Theme colours"
          description="These override the compiled theme on the public site — this is what makes it white-labelable."
          dirty={theme.dirty}
          saving={theme.saving}
          readOnly={readOnly}
          onSave={theme.save}
          onReset={theme.reset}
        >
          <Stack spacing={3}>
            {COLOUR_GROUPS.map((group) => (
              <Box key={group.title}>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
                >
                  {group.title}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  {group.tokens.map((token) => (
                    <ColourField
                      key={token}
                      token={token}
                      value={theme.value![token]}
                      error={theme.fieldErrors[token]}
                      disabled={readOnly}
                      onChange={(next) => theme.patch({ [token]: next } as Partial<BrandingTheme>)}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Typography"
          description="Font family names. The site loads these; the preview only shows them if your machine has them installed."
          dirty={typography.dirty}
          saving={typography.saving}
          readOnly={readOnly}
          onSave={typography.save}
          onReset={typography.reset}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Display (headings)"
              value={typography.value.display}
              onChange={(event) => typography.patch({ display: event.target.value })}
              error={Boolean(typography.fieldErrors.display)}
              helperText={typography.fieldErrors.display}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Body"
              value={typography.value.body}
              onChange={(event) => typography.patch({ body: event.target.value })}
              error={Boolean(typography.fieldErrors.body)}
              helperText={typography.fieldErrors.body}
              disabled={readOnly}
              fullWidth
            />
            <TextField
              label="Armenian fallback"
              value={typography.value.armenian}
              onChange={(event) => typography.patch({ armenian: event.target.value })}
              error={Boolean(typography.fieldErrors.armenian)}
              helperText={
                typography.fieldErrors.armenian ??
                'Sora and Inter carry no Armenian glyphs, so Armenian text needs its own family.'
              }
              disabled={readOnly}
              fullWidth
            />
          </Stack>
        </SectionCard>
      </Stack>

      <Box sx={{ width: { xs: '100%', lg: 340 }, flex: 'none' }}>
        <BrandPreview identity={identity.value} theme={theme.value} typography={typography.value} />
      </Box>
    </Stack>
  );
}

function ColourField({
  token,
  value,
  error,
  disabled,
  onChange,
}: {
  token: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  // The native picker cannot express an invalid value, so the text field stays
  // the source of truth and the swatch is a second way in, not the only one.
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <TextField
      label={token}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(error)}
      helperText={error}
      disabled={disabled}
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Box
                component="input"
                type="color"
                aria-label={`${token} colour picker`}
                value={valid ? value : '#000000'}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value.toUpperCase())}
                sx={{
                  width: 26,
                  height: 26,
                  p: 0,
                  border: 'none',
                  borderRadius: '6px',
                  bgcolor: 'transparent',
                  cursor: disabled ? 'default' : 'pointer',
                  '&::-webkit-color-swatch-wrapper': { p: 0 },
                  '&::-webkit-color-swatch': { border: '1px solid #0000001F', borderRadius: '6px' },
                }}
              />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
