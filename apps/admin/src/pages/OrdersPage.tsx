import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CarOrigin, OrderStageName } from '@autoroom/api/client';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/auth/AuthProvider';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ORIGINS, ORIGIN_LABEL, formatMoney } from '@/pages/cars/carOptions';
import { OrderDialog } from '@/pages/orders/OrderDialog';
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  STAGES,
  STAGE_LABEL,
  STAGE_TONE,
} from '@/pages/orders/orderOptions';
import { mono } from '@/theme';

/**
 * Shipments — `references/admin.md` C4. One row per order: which car, which
 * partner, where it is in the pipeline, and whether it's paid for. Advancing
 * a stage, uploading handover photos, or adding a payment all happen on the
 * detail page this list opens into.
 */
export function OrdersPage() {
  const { api, identity } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState<CarOrigin | ''>('');
  const [stage, setStage] = useState<OrderStageName | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [creating, setCreating] = useState(false);

  const canCreate = identity?.permissions.includes('orders:CREATE') ?? false;

  const query = {
    ...(search ? { search } : {}),
    ...(origin ? { origin } : {}),
    ...(stage ? { stage } : {}),
    take: rowsPerPage,
    skip: page * rowsPerPage,
  };

  const ordersQuery = useQuery({
    queryKey: ['orders', query],
    queryFn: () => api.orders.list(query),
  });

  const orders = ordersQuery.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 1180 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Orders
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Every car's shipment — stage, container/ship/tracking, documents and payments.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreating(true)}
            sx={{ flex: 'none' }}
          >
            New order
          </Button>
        )}
      </Stack>

      <DataTable
        rows={orders}
        getRowId={(order) => order.id}
        isPending={ordersQuery.isPending}
        error={ordersQuery.isError ? ordersQuery.error : undefined}
        errorMessage="Could not load orders."
        emptyMessage="No orders match this search."
        minWidth={900}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
        pagination={{
          page,
          rowsPerPage,
          total: ordersQuery.data?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (next) => {
            setRowsPerPage(next);
            setPage(0);
          },
        }}
        toolbar={
          <>
            <TextField
              placeholder="Search order #, VIN, make or model…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ flex: 1, minWidth: 220 }}
            />
            <TextField
              label="Origin"
              value={origin}
              onChange={(event) => {
                setOrigin(event.target.value as CarOrigin | '');
                setPage(0);
              }}
              select
              size="small"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Any</MenuItem>
              {ORIGINS.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Stage"
              value={stage}
              onChange={(event) => {
                setStage(event.target.value as OrderStageName | '');
                setPage(0);
              }}
              select
              size="small"
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="">Any</MenuItem>
              {STAGES.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
          </>
        }
        columns={[
          {
            key: 'orderNumber',
            header: 'Order #',
            render: (order) => (
              <Typography sx={{ fontFamily: mono, fontSize: '0.8125rem', fontWeight: 600 }}>
                {order.orderNumber}
              </Typography>
            ),
          },
          {
            key: 'car',
            header: 'Car',
            render: (order) => (
              <>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {order.car.make} {order.car.model} {order.car.year}
                </Typography>
                {order.car.vin && (
                  <Typography
                    sx={{ fontFamily: mono, fontSize: '0.75rem', color: 'text.secondary' }}
                  >
                    {order.car.vin}
                  </Typography>
                )}
              </>
            ),
          },
          {
            key: 'origin',
            header: 'Country',
            render: (order) => (
              <Typography sx={{ fontSize: '0.875rem' }}>
                {ORIGIN_LABEL[order.car.origin]}
              </Typography>
            ),
          },
          {
            key: 'partner',
            header: 'Partner',
            render: (order) => (
              <Typography sx={{ fontSize: '0.875rem' }}>{order.partner?.name ?? '—'}</Typography>
            ),
          },
          {
            key: 'stage',
            header: 'Stage',
            render: (order) => (
              <StatusBadge label={STAGE_LABEL[order.stage]} tone={STAGE_TONE[order.stage]} />
            ),
          },
          {
            key: 'payment',
            header: 'Payment',
            render: (order) => (
              <StatusBadge
                label={PAYMENT_STATUS_LABEL[order.paymentStatus]}
                tone={PAYMENT_STATUS_TONE[order.paymentStatus]}
              />
            ),
          },
          {
            key: 'price',
            header: 'Price',
            align: 'right',
            render: (order) => (
              <Typography sx={{ fontSize: '0.875rem' }}>{formatMoney(order.car.price)}</Typography>
            ),
          },
        ]}
      />

      {creating && (
        <OrderDialog
          onClose={() => setCreating(false)}
          onDone={(orderId) => navigate(`/orders/${orderId}`)}
        />
      )}
    </Box>
  );
}
