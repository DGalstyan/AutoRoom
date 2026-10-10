import type { FeatureToggles, SettingRecord } from '@autoroom/api/client';
import { Alert, Box, Stack, Switch, TextField, Typography } from '@mui/material';
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
  const guest = useSettingSection('auction.guestAccess', records);
  if (!features.value || !guest.value) return null;

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
      <SectionCard
        title="Feature toggles"
        description="Turn parts of the public site on and off without a deploy."
        dirty={features.dirty}
        saving={features.saving}
        readOnly={readOnly}
        onSave={features.save}
        onSaveAsync={features.saveAsync}
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

      <SectionCard
        title="Auction guest access"
        description="“Տեսնել մեքենան օնլայն” gives each visitor a temporary, system-generated view-only access instead of a shared login. It stops working after this many minutes. The car's auction link is never shown on the public site, and must not contain a username or password."
        dirty={guest.dirty}
        saving={guest.saving}
        readOnly={readOnly}
        onSave={guest.save}
        onSaveAsync={guest.saveAsync}
        onReset={guest.reset}
      >
        <TextField
          label="Access lasts (minutes)"
          type="number"
          value={guest.value.ttlMinutes}
          onChange={(event) => guest.patch({ ttlMinutes: Number(event.target.value) })}
          error={Boolean(guest.fieldErrors.ttlMinutes)}
          helperText={guest.fieldErrors.ttlMinutes ?? 'Between 5 and 1440 (24 hours).'}
          disabled={readOnly}
          sx={{ maxWidth: 240 }}
        />
      </SectionCard>
    </Stack>
  );
}
