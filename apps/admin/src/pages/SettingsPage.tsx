import { useState } from 'react';
import { Alert, Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useSettings } from '@/pages/settings/useSettingSection';
import { BrandingSettings } from '@/pages/settings/BrandingSettings';
import { ContactsSettings } from '@/pages/settings/ContactsSettings';
import { FeatureSettings } from '@/pages/settings/FeatureSettings';
import { LocalizationSettings } from '@/pages/settings/LocalizationSettings';

type TabKey = 'branding' | 'contacts' | 'features' | 'localization';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'branding', label: 'Branding' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'features', label: 'Features' },
  { key: 'localization', label: 'Localization' },
];

/**
 * Whitelabel settings.
 *
 * One request loads every group; the tabs are a view over that one payload, so
 * switching tabs costs nothing and an edit in one group cannot go stale against
 * another. Each group saves independently — they are separate keys on the
 * server, and a single page-level Save would imply a transaction that does not
 * exist.
 */
export function SettingsPage() {
  const { identity } = useAuth();
  const [tab, setTab] = useState<TabKey>('branding');

  const settingsQuery = useSettings();
  const readOnly = !identity?.permissions.includes('settings:UPDATE');

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Settings
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        Branding, contacts and behaviour for the public site. Changes apply on the next page load.
      </Typography>

      {readOnly && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          Your role can view settings but not change them.
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_event, value: TabKey) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((entry) => (
          <Tab key={entry.key} label={entry.label} value={entry.key} />
        ))}
      </Tabs>

      {settingsQuery.isPending ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
        </Box>
      ) : settingsQuery.isError ? (
        <Alert severity="error">
          {errorMessage(settingsQuery.error, 'Could not load settings.')}
        </Alert>
      ) : (
        <>
          {tab === 'branding' && (
            <BrandingSettings records={settingsQuery.data} readOnly={readOnly} />
          )}
          {tab === 'contacts' && (
            <ContactsSettings records={settingsQuery.data} readOnly={readOnly} />
          )}
          {tab === 'features' && (
            <FeatureSettings records={settingsQuery.data} readOnly={readOnly} />
          )}
          {tab === 'localization' && (
            <LocalizationSettings records={settingsQuery.data} readOnly={readOnly} />
          )}
        </>
      )}
    </Box>
  );
}
