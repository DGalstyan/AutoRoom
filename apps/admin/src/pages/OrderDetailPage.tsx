import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageAlbum, OrderUpdateInput } from '@autoroom/api/client';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage, extractFieldErrors } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImageAlbums } from '@/pages/cars/ImageAlbums';
import { ALBUMS, ORIGIN_LABEL, formatMoney } from '@/pages/cars/carOptions';
import { DocumentsPanel } from '@/pages/orders/DocumentsPanel';
import { LogisticsFields } from '@/pages/orders/LogisticsFields';
import { PaymentsPanel } from '@/pages/orders/PaymentsPanel';
import { StageTimeline } from '@/pages/orders/StageTimeline';
import { mono } from '@/theme';

/** The three albums this page's photo section covers — auction/receipt lot
 * photos and the Gyumri handover set, uploaded to the same car the order is
 * for. The car's other four albums (exterior/interior/details/video) are the
 * listing's own photos, edited from `CarFormPage` instead. */
const ORDER_ALBUMS = ALBUMS.filter((album) =>
  (['AUCTION', 'RECEIPT', 'HANDOVER'] as ImageAlbum[]).includes(album.value),
);

/**
 * One order's full picture — `references/admin.md` C4's detail screen:
 * delivery data, the stage timeline, order photos, documents and the
 * payments ledger. Everything here is what the partner portal's own order
 * view reads back.
 */
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { api, identity } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleting, setDeleting] = useState(false);

  const canUpdate = identity?.permissions.includes('orders:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('orders:DELETE') ?? false;
  const canReadPartners = identity?.permissions.includes('partners:READ') ?? false;
  const canCreateDocuments = identity?.permissions.includes('documents:CREATE') ?? false;
  const canDeleteDocuments = identity?.permissions.includes('documents:DELETE') ?? false;
  const canCreatePayments = identity?.permissions.includes('payments:CREATE') ?? false;
  const canDeletePayments = identity?.permissions.includes('payments:DELETE') ?? false;

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.orders.get(id!),
  });
  const order = orderQuery.data;

  const carQuery = useQuery({
    queryKey: ['car', order?.carId],
    queryFn: () => api.cars.get(order!.carId),
    enabled: Boolean(order),
  });

  const partnersQuery = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.partners.list({ take: 100 }),
    enabled: canReadPartners,
  });

  const [draft, setDraft] = useState<OrderUpdateInput | null>(null);
  useEffect(() => {
    if (order) {
      setDraft({
        orderNumber: order.orderNumber,
        partnerId: order.partnerId,
        containerNumber: order.containerNumber,
        shipName: order.shipName,
        trackingUrl: order.trackingUrl,
        color: order.color,
        saleOrigin: order.saleOrigin,
        purchaseDate: order.purchaseDate,
        paidDate: order.paidDate,
        seller: order.seller,
        deliveryBranch: order.deliveryBranch,
        truckingRequired: order.truckingRequired,
        exporter: order.exporter,
        consignee: order.consignee,
        receivingAgent: order.receivingAgent,
        consolidate: order.consolidate,
        finalDestination: order.finalDestination,
        shippingLine: order.shippingLine,
        buyerCode: order.buyerCode,
        gatePassId: order.gatePassId,
        oceanCargoType: order.oceanCargoType,
        inspectionStatus: order.inspectionStatus,
        hasKeys: order.hasKeys,
        insured: order.insured,
      });
    }
  }, [order]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: () => api.orders.update(id!, draft!),
    onSuccess: () => {
      setFieldErrors({});
      toast('Saved.');
      void orderQuery.refetch();
    },
    onError: (error) => {
      setFieldErrors(extractFieldErrors(error));
      toast(errorMessage(error, 'Could not save.'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.orders.remove(id!),
    onSuccess: () => {
      toast('Order deleted.');
      navigate('/orders', { replace: true });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  async function handleAddImage(album: ImageAlbum, file: File) {
    await api.cars.addImage(order!.carId, { album, url: (await api.upload(file)).url });
    await queryClient.invalidateQueries({ queryKey: ['car', order!.carId] });
  }
  async function handleRemoveImage(image: { id: string }) {
    await api.cars.removeImage(order!.carId, image.id);
    await queryClient.invalidateQueries({ queryKey: ['car', order!.carId] });
  }
  async function handleReorderImages(album: ImageAlbum, imageIds: string[]) {
    await api.cars.reorderImages(order!.carId, album, imageIds);
    await queryClient.invalidateQueries({ queryKey: ['car', order!.carId] });
  }

  if (orderQuery.isPending || !draft) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
        <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <Alert severity="error">{errorMessage(orderQuery.error, 'Could not load this order.')}</Alert>
    );
  }

  const car = carQuery.data;
  const readOnlyDelivery = !canUpdate;

  return (
    <Box sx={{ maxWidth: 980 }}>
      <Button
        component={RouterLink}
        to="/orders"
        startIcon={<ArrowBackIcon sx={{ fontSize: 13 }} />}
        size="small"
        color="inherit"
        sx={{ mb: 1.5, ml: -1 }}
      >
        Orders
      </Button>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            {order.car.make} {order.car.model} {order.car.year}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography sx={{ fontFamily: mono, fontSize: '0.8125rem', color: 'text.secondary' }}>
              {order.orderNumber}
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
              · {ORIGIN_LABEL[order.car.origin]} · {formatMoney(order.car.price)}
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button component={RouterLink} to={`/cars/${order.carId}`} size="small" color="inherit">
            View car
          </Button>
          {canDelete && (
            <Button size="small" color="error" onClick={() => setDeleting(true)}>
              Delete order
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Delivery data
          </Typography>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Order number"
                value={draft.orderNumber}
                onChange={(event) => setDraft({ ...draft, orderNumber: event.target.value })}
                fullWidth
                disabled={readOnlyDelivery}
                error={Boolean(fieldErrors.orderNumber)}
                helperText={fieldErrors.orderNumber}
              />
              {canReadPartners && (
                <Autocomplete
                  fullWidth
                  options={partnersQuery.data?.items ?? []}
                  value={
                    (partnersQuery.data?.items ?? []).find((p) => p.id === draft.partnerId) ?? null
                  }
                  loading={partnersQuery.isFetching}
                  disabled={readOnlyDelivery}
                  getOptionLabel={(partner) => partner.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_event, selected) =>
                    setDraft({ ...draft, partnerId: selected?.id ?? null })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Partner"
                      placeholder="Unassigned"
                      error={Boolean(fieldErrors.partnerId)}
                      helperText={fieldErrors.partnerId}
                    />
                  )}
                />
              )}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Container number"
                value={draft.containerNumber ?? ''}
                onChange={(event) =>
                  setDraft({ ...draft, containerNumber: event.target.value || null })
                }
                fullWidth
                disabled={readOnlyDelivery}
                error={Boolean(fieldErrors.containerNumber)}
                helperText={fieldErrors.containerNumber}
              />
              <TextField
                label="Ship name"
                value={draft.shipName ?? ''}
                onChange={(event) => setDraft({ ...draft, shipName: event.target.value || null })}
                fullWidth
                disabled={readOnlyDelivery}
                error={Boolean(fieldErrors.shipName)}
                helperText={fieldErrors.shipName}
              />
            </Stack>

            <TextField
              label="Tracking URL"
              value={draft.trackingUrl ?? ''}
              onChange={(event) => setDraft({ ...draft, trackingUrl: event.target.value || null })}
              fullWidth
              disabled={readOnlyDelivery}
              error={Boolean(fieldErrors.trackingUrl)}
              helperText={fieldErrors.trackingUrl}
            />

            {canUpdate && (
              <Box>
                <Button
                  variant="contained"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>

        <LogisticsFields draft={draft} setDraft={setDraft} disabled={readOnlyDelivery} />
        {canUpdate && (
          <Box>
            <Button
              variant="contained"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        )}

        <StageTimeline order={order} canAdvance={canUpdate} />

        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Order photos
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2.5 }}>
            Auction lot photos, purchase receipts, and the handover set uploaded in Gyumri when the
            container opens — attached to the car itself.
          </Typography>
          {car ? (
            <ImageAlbums
              images={car.images}
              readOnly={readOnlyDelivery}
              onAdd={handleAddImage}
              onRemove={handleRemoveImage}
              onReorder={handleReorderImages}
              albums={ORDER_ALBUMS}
            />
          ) : (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
              <CircularProgress size={18} thickness={5} sx={{ color: 'text.secondary' }} />
            </Box>
          )}
        </Paper>

        <DocumentsPanel
          order={order}
          canCreate={canCreateDocuments}
          canDelete={canDeleteDocuments}
        />

        <PaymentsPanel order={order} canCreate={canCreatePayments} canDelete={canDeletePayments} />
      </Stack>

      {deleting && (
        <ConfirmDialog
          open
          title="Delete this order?"
          message={`"${order.orderNumber}" and its whole history — stages, documents and payments — will be permanently deleted. The car itself is not affected.`}
          confirmLabel="Delete"
          destructive
          busy={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
          onClose={() => setDeleting(false)}
        />
      )}
    </Box>
  );
}
