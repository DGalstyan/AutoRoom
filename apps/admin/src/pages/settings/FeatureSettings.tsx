import type { FeatureToggles, SettingRecord } from '@autoroom/api/client';
import { Alert, Box, Stack, Switch, Typography } from '@mui/material';
import { SectionCard } from '@/pages/settings/SectionCard';
import { useSettingSection } from '@/pages/settings/useSettingSection';
import { brand } from '@/theme';

const TOGGLES: { key: keyof FeatureToggles; label: string; description: string }[] = [
  {
    key: 'quiz',
    label: 'Quiz popup',
    description: 'The multi-step quiz on the sticky CTA and the homepage.',
  },
  {
    key: 'registrationInviteOnly',
    label: 'Invite-only registration',
    description:
      'Blocks self-registration through the API. The panel has no sign-up form, so this only matters if one is added back.',
  },
  {
    key: 'maintenanceMode',
    label: 'Maintenance mode',
    description: 'Puts the public site behind a maintenance notice. Does not affect this panel.',
  },
];

export function FeatureSettings({
  records,
  readOnly,
}: {
  records: SettingRecord[] | undefined;
  readOnly: boolean;
}) {
  const features = useSettingSection('features.toggles', records);
  if (!features.value) return null;

  return (
    <Box sx={{ maxWidth: 720 }}>
      <SectionCard
        title="Feature toggles"
        description="Turn parts of the public site on and off without a deploy."
        dirty={features.dirty}
        saving={features.saving}
        readOnly={readOnly}
        onSave={features.save}
        onReset={features.reset}
      >
        <Stack divider={<Box sx={{ borderBottom: `1px solid ${brand.lineLight}` }} />}>
          {TOGGLES.map((toggle) => (
            <Stack
              key={toggle.key}
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', py: 1.75 }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                  {toggle.label}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                  {toggle.description}
                </Typography>
              </Box>
              <Switch
                checked={features.value![toggle.key]}
                onChange={(event) => features.patch({ [toggle.key]: event.target.checked })}
                disabled={readOnly}
                inputProps={{ 'aria-label': toggle.label }}
              />
            </Stack>
          ))}
        </Stack>

        {features.value.maintenanceMode && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Maintenance mode is on. Visitors to the public site see the notice instead of the site.
          </Alert>
        )}
      </SectionCard>
    </Box>
  );
}
