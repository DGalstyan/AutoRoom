import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Car } from '@autoroom/api/client';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { DocumentsPanel } from '@/pages/orders/DocumentsPanel';

/**
 * Invoices and other paperwork for a car that is assigned to a partner. Documents hang off the
 * car's order (that is what the partner sees in the portal, next to payments and the stage
 * timeline), so this shows the order's documents right on the car — and creates the order with
 * one click when the car has none yet. Photos are the car's own albums, edited above.
 */
export function PartnerPaperwork({ car }: { car: Car }) {
  const { api, identity } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const can = (permission: string) => identity?.permissions.includes(permission) ?? false;

  const found = useQuery({
    queryKey: ['order-for-car', car.id],
    queryFn: () => api.orders.list({ carId: car.id, take: 1 }),
    enabled: can('orders:READ'),
  });
  const orderId = found.data?.items[0]?.id;
  const order = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.orders.get(orderId!),
    enabled: Boolean(orderId),
  });

  const create = useMutation({
    mutationFn: () => {
      // A readable, unique reference; staff can rename it on the order page.
      const stamp = new Date().toISOString().slice(2, 10).replaceAll('-', '');
      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      return api.orders.create({
        carId: car.id,
        orderNumber: `AR-${stamp}-${suffix}`,
        partnerId: car.partnerId,
      });
    },
    onSuccess: () => {
      toast('Order created. You can add documents now.');
      void queryClient.invalidateQueries({ queryKey: ['order-for-car', car.id] });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  if (!can('orders:READ')) {
    return (
      <Alert severity="info">You do not have access to orders, so paperwork cannot be shown.</Alert>
    );
  }
  if (found.isPending || (orderId && order.isPending)) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
        <CircularProgress size={18} thickness={5} />
      </Box>
    );
  }
  if (found.isError || order.isError) {
    return <Alert severity="error">Could not load this car&apos;s paperwork.</Alert>;
  }

  if (!order.data) {
    return (
      <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          Invoices and documents are kept on the car&apos;s order, which is what the partner sees in
          their portal. This car has no order yet.
        </Typography>
        {can('orders:CREATE') && (
          <Button variant="contained" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create order to add documents'}
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
        Order {order.data.orderNumber} ·{' '}
        <RouterLink to={`/orders/${order.data.id}`}>open the full order</RouterLink> (stages,
        payments, logistics)
      </Typography>
      <DocumentsPanel
        order={order.data}
        canCreate={can('documents:CREATE')}
        canDelete={can('documents:DELETE')}
      />
    </Stack>
  );
}
