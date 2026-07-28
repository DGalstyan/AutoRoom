import type { SettingRecord } from '@autoroom/api/client';
import { Box, Button, IconButton, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { SectionCard } from '@/pages/settings/SectionCard';
import { useSettingSection } from '@/pages/settings/useSettingSection';

export function ContactsSettings({
  records,
  readOnly,
}: {
  records: SettingRecord[] | undefined;
  readOnly: boolean;
}) {
  const general = useSettingSection('contacts.general', records);
  const social = useSettingSection('contacts.social', records);
  const messengers = useSettingSection('contacts.messengers', records);

  if (!general.value || !social.value || !messengers.value) return null;

  const phones = general.value.phones;

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
      <SectionCard
        title="Contact details"
        description="Shown in the site header, footer and contact page."
        dirty={general.dirty}
        saving={general.saving}
        readOnly={readOnly}
        onSave={general.save}
        onReset={general.reset}
      >
        <Stack spacing={2.5}>
          <Box>
            <Stack spacing={1.5}>
              {phones.map((phone, index) => (
                <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    label={`Phone ${index + 1}`}
                    value={phone}
                    onChange={(event) =>
                      general.patch({
                        phones: phones.map((entry, i) =>
                          i === index ? event.target.value : entry,
                        ),
                      })
                    }
                    error={Boolean(general.fieldErrors[`phones.${index}`])}
                    helperText={general.fieldErrors[`phones.${index}`]}
                    disabled={readOnly}
                    fullWidth
                  />
                  {!readOnly && (
                    <IconButton
                      onClick={() =>
                        general.patch({ phones: phones.filter((_, i) => i !== index) })
                      }
                      aria-label={`Remove phone ${index + 1}`}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>

            {!readOnly && (
              <Button
                onClick={() => general.patch({ phones: [...phones, ''] })}
                startIcon={<AddIcon />}
                size="small"
                sx={{ mt: phones.length ? 1.5 : 0 }}
              >
                Add phone
              </Button>
            )}
          </Box>

          <TextField
            label="Email"
            type="email"
            value={general.value.email ?? ''}
            onChange={(event) => general.patch({ email: event.target.value || null })}
            error={Boolean(general.fieldErrors.email)}
            helperText={general.fieldErrors.email}
            disabled={readOnly}
            fullWidth
          />

          <TextField
            label="Working hours"
            value={general.value.workingHours ?? ''}
            onChange={(event) => general.patch({ workingHours: event.target.value || null })}
            error={Boolean(general.fieldErrors.workingHours)}
            helperText={general.fieldErrors.workingHours}
            disabled={readOnly}
            fullWidth
          />
        </Stack>
      </SectionCard>

      <SectionCard
        title="Social networks"
        description="Full profile URLs. Blank hides the icon rather than linking nowhere."
        dirty={social.dirty}
        saving={social.saving}
        readOnly={readOnly}
        onSave={social.save}
        onReset={social.reset}
      >
        <Stack spacing={2.5}>
          {(['facebook', 'instagram', 'tiktok', 'linkedin'] as const).map((network) => (
            <TextField
              key={network}
              label={LABELS[network]}
              value={social.value![network] ?? ''}
              onChange={(event) => social.patch({ [network]: event.target.value || null })}
              error={Boolean(social.fieldErrors[network])}
              helperText={social.fieldErrors[network]}
              disabled={readOnly}
              fullWidth
            />
          ))}
        </Stack>
      </SectionCard>

      <SectionCard
        title="Messengers"
        description="Numbers or handles, as the messenger expects them."
        dirty={messengers.dirty}
        saving={messengers.saving}
        readOnly={readOnly}
        onSave={messengers.save}
        onReset={messengers.reset}
      >
        <Stack spacing={2.5}>
          {(['whatsapp', 'viber', 'telegram'] as const).map((messenger) => (
            <TextField
              key={messenger}
              label={LABELS[messenger]}
              value={messengers.value![messenger] ?? ''}
              onChange={(event) => messengers.patch({ [messenger]: event.target.value || null })}
              error={Boolean(messengers.fieldErrors[messenger])}
              helperText={messengers.fieldErrors[messenger]}
              disabled={readOnly}
              fullWidth
            />
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}

const LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  viber: 'Viber',
  telegram: 'Telegram',
};
