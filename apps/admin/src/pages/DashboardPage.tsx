import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { brand, mono } from '@/theme';

/**
 * Landing screen.
 *
 * Deliberately not a wall of placeholder metrics: the counts A7 will show —
 * new leads, active orders, cars by status — need Phase B–C data that does not
 * exist yet, and inventing them would make the panel look finished when it is
 * not. What it shows instead is true today and genuinely useful: who you are
 * signed in as and exactly what your role can reach.
 */
export function DashboardPage() {
  const { identity } = useAuth();
  if (!identity) return null;

  const byResource = groupPermissions(identity.permissions);

  return (
    <Box sx={{ maxWidth: 980 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        Signed in
      </Typography>
      <Typography variant="h2" sx={{ mt: 0.5, mb: 1 }}>
        {greeting()}, {identity.name.split(' ')[0]}.
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 4 }}>
        The catalogue, CRM and order modules arrive in the next phases. Your access is already live.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Fact label="Role" value={identity.role.name} />
        <Fact label="Permissions" value={String(identity.permissions.length)} />
        <Fact label="Resources" value={String(Object.keys(byResource).length)} />
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          What you can do
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 3 }}>
          Granted by the {identity.role.name} role. A super admin can change these at any time.
        </Typography>

        <Stack spacing={1.5}>
          {Object.entries(byResource)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([resource, actions]) => (
              <Box
                key={resource}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '150px 1fr' },
                  gap: { xs: 0.75, sm: 2 },
                  alignItems: 'center',
                  pb: 1.5,
                  borderBottom: `1px solid ${brand.lineLight}`,
                  '&:last-of-type': { borderBottom: 'none', pb: 0 },
                }}
              >
                <Typography sx={{ fontFamily: mono, fontSize: '0.8125rem' }}>{resource}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {actions.map((action) => (
                    <Chip
                      key={action}
                      label={action.toLowerCase()}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.6875rem',
                        fontFamily: mono,
                        letterSpacing: '0.04em',
                        bgcolor: `${brand.ink}0A`,
                        color: brand.ink,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
        </Stack>
      </Paper>
    </Box>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ px: 2.5, py: 2, borderRadius: 3, flex: 1, minWidth: 0 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.375rem', fontWeight: 600, mt: 0.5 }} noWrap>
        {value}
      </Typography>
    </Paper>
  );
}

function groupPermissions(permissions: string[]) {
  return permissions.reduce<Record<string, string[]>>((grouped, entry) => {
    const [resource, action] = entry.split(':');
    if (!resource || !action) return grouped;
    (grouped[resource] ??= []).push(action);
    return grouped;
  }, {});
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
