import type { ReactNode } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { brand } from '@/theme';

/**
 * Frame for one saveable settings group.
 *
 * Save sits with the fields it saves rather than in one page-level bar: the
 * groups are independent writes to independent keys, and a single Save would
 * imply the page commits as a unit when it does not.
 */
export function SectionCard({
  title,
  description,
  dirty,
  saving,
  readOnly,
  onSave,
  onReset,
  children,
}: {
  title: string;
  description?: string;
  dirty: boolean;
  saving: boolean;
  readOnly?: boolean;
  onSave: () => void;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: { xs: 2.5, md: 3 }, pt: { xs: 2.5, md: 3 }, pb: 2 }}>
        <Typography variant="h5" sx={{ mb: description ? 0.5 : 0 }}>
          {title}
        </Typography>
        {description && (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            {description}
          </Typography>
        )}
      </Box>

      <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 3 }}>{children}</Box>

      {!readOnly && (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            px: { xs: 2.5, md: 3 },
            py: 2,
            borderTop: `1px solid ${brand.lineLight}`,
            bgcolor: brand.surfaceLight,
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {dirty && (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', mr: 'auto' }}>
              Unsaved changes
            </Typography>
          )}
          <Button onClick={onReset} disabled={!dirty || saving} color="inherit" size="small">
            Discard
          </Button>
          <Button onClick={onSave} disabled={!dirty || saving} variant="contained" size="small">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
