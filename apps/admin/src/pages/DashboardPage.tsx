import { Box, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';
import { useAuth } from '@/auth/AuthProvider';
import { STAGES } from '@/pages/orders/orderOptions';
import { brand } from '@/theme';

/**
 * Landing screen.
 *
 * Cars, leads and orders counts are all real data the API already has
 * (Phase A/C1/C4) — `take: 1` on the cars/leads queries, since only `total`
 * is needed, not the rows. The orders chart needs actual rows (to bucket by
 * stage), so that one query takes more than `1`; row counts at this
 * business's scale make that cost nothing.
 */
export function DashboardPage() {
  const { identity, api } = useAuth();

  const canReadCars = identity?.permissions.includes('cars:READ') ?? false;
  const canReadLeads = identity?.permissions.includes('leads:READ') ?? false;
  const canReadOrders = identity?.permissions.includes('orders:READ') ?? false;

  const carsQuery = useQuery({
    queryKey: ['dashboard', 'cars-count'],
    queryFn: () => api.cars.list({ take: 1 }),
    enabled: canReadCars,
  });
  const newLeadsQuery = useQuery({
    queryKey: ['dashboard', 'new-leads-count'],
    queryFn: () => api.leads.list({ status: 'NEW', take: 1 }),
    enabled: canReadLeads,
  });
  const ordersQuery = useQuery({
    queryKey: ['dashboard', 'orders'],
    queryFn: () => api.orders.list({ take: 100 }),
    enabled: canReadOrders,
  });

  if (!identity) return null;

  const byResource = groupPermissions(identity.permissions);

  const stageCounts = STAGES.map((stage) => ({
    label: stage.label,
    count: (ordersQuery.data?.items ?? []).filter((order) => order.stage === stage.value).length,
  }));

  return (
    <Box sx={{ maxWidth: 980 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        Signed in
      </Typography>
      <Typography variant="h2" sx={{ mt: 0.5, mb: 1 }}>
        {greeting()}, {identity.name.split(' ')[0]}.
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 4 }}>Your access is already live.</Typography>

      {(canReadCars || canReadLeads || canReadOrders) && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {canReadCars && (
            <Fact
              label="Cars uploaded"
              value={carsQuery.isPending ? '—' : String(carsQuery.data?.total ?? 0)}
              to="/cars"
            />
          )}
          {canReadLeads && (
            <Fact
              label="New leads"
              value={newLeadsQuery.isPending ? '—' : String(newLeadsQuery.data?.total ?? 0)}
              to="/leads"
            />
          )}
          {canReadOrders && (
            <Fact
              label="Orders"
              value={ordersQuery.isPending ? '—' : String(ordersQuery.data?.total ?? 0)}
              to="/orders"
            />
          )}
        </Stack>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Fact label="Role" value={identity.role.name} />
        <Fact label="Permissions" value={String(identity.permissions.length)} />
        <Fact label="Resources" value={String(Object.keys(byResource).length)} />
      </Stack>

      {canReadOrders && (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Orders by stage
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 3 }}>
            Every order this account can see, bucketed by where it is in the shipping pipeline.
          </Typography>

          {ordersQuery.isPending ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                Loading…
              </Typography>
            </Box>
          ) : (ordersQuery.data?.items.length ?? 0) === 0 ? (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', py: 4 }}>
              No orders yet.
            </Typography>
          ) : (
            <BarChart
              height={280}
              dataset={stageCounts}
              xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
              series={[{ dataKey: 'count', label: 'Orders', color: brand.accent }]}
              grid={{ horizontal: true }}
            />
          )}
        </Paper>
      )}
    </Box>
  );
}

function Fact({ label, value, to }: { label: string; value: string; to?: string }) {
  return (
    <Paper
      variant="outlined"
      {...(to ? { component: RouterLink, to } : {})}
      sx={{
        px: 2.5,
        py: 2,
        borderRadius: 3,
        flex: 1,
        minWidth: 0,
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 120ms ease',
        ...(to ? { '&:hover': { borderColor: 'text.secondary' } } : {}),
      }}
    >
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
