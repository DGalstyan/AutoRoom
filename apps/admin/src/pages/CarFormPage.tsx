import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CarCondition,
  CarImage,
  CarInput,
  CarOrigin,
  CarStatusBadge,
  ImageAlbum,
  Powertrain,
} from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage, extractFieldErrors } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ImageAlbums, type StagedImage } from '@/pages/cars/ImageAlbums';
import { ColourEditor } from '@/pages/cars/ColourEditor';
import { PriceJourneyEditor } from '@/pages/cars/PriceJourneyEditor';
import { CONDITIONS, ORIGINS, POWERTRAINS, STATUS_BADGES, slugify } from '@/pages/cars/carOptions';
import { brand, mono } from '@/theme';

const BLANK: CarInput = {
  slug: '',
  origin: 'CHINA',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  trim: null,
  powertrain: 'EV',
  range: null,
  battery: null,
  engine: null,
  drivetrain: null,
  transmission: null,
  seats: null,
  warranty: null,
  vin: null,
  lotNumber: null,
  mileage: null,
  price: 0,
  oldPrice: null,
  estFinalPriceAM: null,
  condition: 'ON_ORDER',
  statusBadge: null,
  deliveryEtaDays: null,
  location: null,
  damageHistory: null,
  financingAvailable: true,
  featured: false,
  partnerId: null,
  colors: [],
  priceJourney: [],
  similarCarIds: [],
};

/**
 * Create and edit one car.
 *
 * Images are their own endpoints — a file lands on `/uploads` the moment it is
 * picked, not on Save — so while creating, uploads are staged in local state
 * (`pendingImages`) rather than lost until a car id exists to attach them to.
 * Once `cars.create` returns one, the staged uploads are attached in the same
 * flow the edit view uses one at a time, and the draft is cleared.
 */
export function CarFormPage() {
  const { id } = useParams<{ id: string }>();
  const creating = id === 'new' || id === undefined;

  const { api, identity } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canCreate = identity?.permissions.includes('cars:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('cars:UPDATE') ?? false;
  const canPublish = identity?.permissions.includes('cars:PUBLISH') ?? false;
  const readOnly = creating ? !canCreate : !canUpdate;

  const carQuery = useQuery({
    queryKey: ['car', id],
    queryFn: () => api.cars.get(id!),
    enabled: !creating,
  });

  // Only fetched when the viewer may read partners — otherwise the request can
  // only 403, and the picker is hidden anyway.
  const canReadPartners = identity?.permissions.includes('partners:READ') ?? false;
  const partnersQuery = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.partners.list({ take: 100 }),
    enabled: canReadPartners,
  });
  const partners = partnersQuery.data?.items ?? [];

  const [draft, setDraft] = useState<CarInput>(BLANK);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [pendingImages, setPendingImages] = useState<StagedImage[]>([]);

  useEffect(() => {
    if (carQuery.data) {
      const {
        id: _id,
        publishedAt,
        images,
        createdAt,
        updatedAt,
        similarCars,
        ...input
      } = carQuery.data;
      void _id;
      void publishedAt;
      void images;
      void createdAt;
      void updatedAt;
      setDraft({ ...input, similarCarIds: similarCars.map((car) => car.id) });
      setSlugTouched(true);
    }
  }, [carQuery.data]);

  // A slug is derived until someone edits it by hand, at which point it is
  // theirs — silently rewriting a deliberate slug would be worse than a typo.
  const suggestedSlug = useMemo(
    () => slugify(`${draft.make} ${draft.model} ${draft.year}`),
    [draft.make, draft.model, draft.year],
  );
  useEffect(() => {
    if (creating && !slugTouched) setDraft((current) => ({ ...current, slug: suggestedSlug }));
  }, [creating, slugTouched, suggestedSlug]);

  const saveMutation = useMutation({
    mutationFn: (body: CarInput) => (creating ? api.cars.create(body) : api.cars.update(id!, body)),
    onSuccess: async (car) => {
      setFieldErrors({});

      // Staged during creation, attached now that the car has an id — one at a
      // time, same as the edit view, so a mid-batch failure leaves the rest
      // still staged rather than silently dropped.
      if (creating && pendingImages.length > 0) {
        for (const image of pendingImages) {
          await api.cars.addImage(car.id, { album: image.album, url: image.url });
        }
        setPendingImages([]);
      }

      toast(creating ? 'Car created.' : 'Saved.');
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
      void queryClient.invalidateQueries({ queryKey: ['car', car.id] });
      if (creating) navigate(`/cars/${car.id}`, { replace: true });
    },
    onError: (error) => {
      setFieldErrors(extractFieldErrors(error));
      toast(errorMessage(error, 'Could not save.'), 'error');
    },
  });

  async function handleAddImage(album: ImageAlbum, file: File) {
    const uploaded = await api.upload(file);
    if (creating) {
      setPendingImages((current) => [
        ...current,
        { id: crypto.randomUUID(), album, url: uploaded.url },
      ]);
      return;
    }
    await api.cars.addImage(id!, { album, url: uploaded.url });
    await queryClient.invalidateQueries({ queryKey: ['car', id] });
  }

  async function handleRemoveImage(image: CarImage | StagedImage) {
    if (creating) {
      setPendingImages((current) => current.filter((staged) => staged.id !== image.id));
      return;
    }
    await api.cars.removeImage(id!, image.id);
    await queryClient.invalidateQueries({ queryKey: ['car', id] });
  }

  const publishMutation = useMutation({
    mutationFn: (published: boolean) => api.cars.setPublished(id!, published),
    onSuccess: (car) => {
      toast(car.publishedAt ? 'Published — live on the site.' : 'Unpublished.');
      void queryClient.invalidateQueries({ queryKey: ['car', car.id] });
      void queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  function set<K extends keyof CarInput>(key: K, value: CarInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  if (!creating && carQuery.isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
        <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  }

  if (!creating && carQuery.isError) {
    return (
      <Alert severity="error">{errorMessage(carQuery.error, 'Could not load this car.')}</Alert>
    );
  }

  const car = carQuery.data;
  const published = Boolean(car?.publishedAt);

  return (
    <Box sx={{ maxWidth: 980 }}>
      <Button
        component={RouterLink}
        to="/cars"
        startIcon={<ArrowBackIcon sx={{ fontSize: 13 }} />}
        size="small"
        color="inherit"
        sx={{ mb: 1.5, ml: -1 }}
      >
        Cars
      </Button>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            {creating ? 'New car' : `${draft.make} ${draft.model}`.trim() || 'Car'}
          </Typography>
          {!creating && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontFamily: mono, fontSize: '0.8125rem', color: 'text.secondary' }}>
                {draft.slug}
              </Typography>
              <Chip
                label={published ? 'Published' : 'Draft'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: published ? brand.success : brand.muted,
                  bgcolor: `${published ? brand.success : brand.muted}18`,
                }}
              />
            </Stack>
          )}
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ flex: 'none' }}>
          {!creating && canPublish && (
            <Button
              onClick={() => publishMutation.mutate(!published)}
              disabled={publishMutation.isPending}
              variant="outlined"
            >
              {published ? 'Unpublish' : 'Publish'}
            </Button>
          )}
          {!readOnly && (
            <Button
              onClick={() => saveMutation.mutate(draft)}
              disabled={saveMutation.isPending}
              variant="contained"
            >
              {saveMutation.isPending ? 'Saving…' : creating ? 'Create car' : 'Save'}
            </Button>
          )}
        </Stack>
      </Stack>

      {readOnly && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          Your role can view this car but not change it.
        </Alert>
      )}

      <Stack spacing={2.5}>
        <Section title="Identity">
          <Grid>
            <TextField
              label="Make"
              value={draft.make}
              onChange={(event) => set('make', event.target.value)}
              error={Boolean(fieldErrors.make)}
              helperText={fieldErrors.make}
              disabled={readOnly}
              required
            />
            <TextField
              label="Model"
              value={draft.model}
              onChange={(event) => set('model', event.target.value)}
              error={Boolean(fieldErrors.model)}
              helperText={fieldErrors.model}
              disabled={readOnly}
              required
            />
            <TextField
              label="Year"
              type="number"
              value={draft.year}
              onChange={(event) => set('year', Number(event.target.value))}
              error={Boolean(fieldErrors.year)}
              helperText={fieldErrors.year}
              disabled={readOnly}
              required
            />
            <TextField
              label="Trim"
              value={draft.trim ?? ''}
              onChange={(event) => set('trim', event.target.value || null)}
              disabled={readOnly}
            />
            <TextField
              label="Origin"
              value={draft.origin}
              onChange={(event) => set('origin', event.target.value as CarOrigin)}
              select
              disabled={readOnly}
            >
              {ORIGINS.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="URL slug"
              value={draft.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set('slug', event.target.value);
              }}
              error={Boolean(fieldErrors.slug)}
              helperText={fieldErrors.slug ?? 'Lowercase, hyphenated. Its address on the site.'}
              disabled={readOnly}
              required
            />
          </Grid>
        </Section>

        <Section title="Specification">
          <Grid>
            <TextField
              label="Powertrain"
              value={draft.powertrain}
              onChange={(event) => set('powertrain', event.target.value as Powertrain)}
              select
              disabled={readOnly}
            >
              {POWERTRAINS.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Range (km)"
              type="number"
              value={draft.range ?? ''}
              onChange={(event) =>
                set('range', event.target.value ? Number(event.target.value) : null)
              }
              disabled={readOnly}
            />
            <TextField
              label="Battery"
              value={draft.battery ?? ''}
              onChange={(event) => set('battery', event.target.value || null)}
              placeholder="100 kWh"
              disabled={readOnly}
            />
            <TextField
              label="Engine"
              value={draft.engine ?? ''}
              onChange={(event) => set('engine', event.target.value || null)}
              disabled={readOnly}
            />
            <TextField
              label="Drivetrain"
              value={draft.drivetrain ?? ''}
              onChange={(event) => set('drivetrain', event.target.value || null)}
              placeholder="AWD"
              disabled={readOnly}
            />
            <TextField
              label="Transmission"
              value={draft.transmission ?? ''}
              onChange={(event) => set('transmission', event.target.value || null)}
              disabled={readOnly}
            />
            <TextField
              label="Seats"
              type="number"
              value={draft.seats ?? ''}
              onChange={(event) =>
                set('seats', event.target.value ? Number(event.target.value) : null)
              }
              disabled={readOnly}
            />
            <TextField
              label="Warranty"
              value={draft.warranty ?? ''}
              onChange={(event) => set('warranty', event.target.value || null)}
              disabled={readOnly}
            />
          </Grid>
        </Section>

        <Section title="Pricing">
          <Grid>
            <TextField
              label="Price (USD)"
              type="number"
              value={draft.price}
              onChange={(event) => set('price', Number(event.target.value))}
              error={Boolean(fieldErrors.price)}
              helperText={fieldErrors.price}
              disabled={readOnly}
              required
            />
            <TextField
              label="Old price (USD)"
              type="number"
              value={draft.oldPrice ?? ''}
              onChange={(event) =>
                set('oldPrice', event.target.value ? Number(event.target.value) : null)
              }
              helperText="Shown struck through."
              disabled={readOnly}
            />
            <TextField
              label="Est. final price (AMD)"
              type="number"
              value={draft.estFinalPriceAM ?? ''}
              onChange={(event) =>
                set('estFinalPriceAM', event.target.value ? Number(event.target.value) : null)
              }
              disabled={readOnly}
            />
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={draft.financingAvailable}
                onChange={(event) => set('financingAvailable', event.target.checked)}
                disabled={readOnly}
              />
            }
            label="Financing available"
            sx={{ mt: 1 }}
          />
        </Section>

        <Section
          title="Price journey"
          description="Four chips breaking down how the final price is reached."
        >
          <PriceJourneyEditor
            chips={draft.priceJourney}
            onChange={(chips) => set('priceJourney', chips)}
            readOnly={readOnly}
          />
        </Section>

        <Section title="Availability">
          <Grid>
            <TextField
              label="Condition"
              value={draft.condition}
              onChange={(event) => set('condition', event.target.value as CarCondition)}
              select
              disabled={readOnly}
              helperText={CONDITIONS.find((entry) => entry.value === draft.condition)?.hint}
            >
              {CONDITIONS.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Shipping badge"
              value={draft.statusBadge ?? ''}
              onChange={(event) =>
                set('statusBadge', (event.target.value || null) as CarStatusBadge | null)
              }
              select
              disabled={readOnly}
            >
              <MenuItem value="">None</MenuItem>
              {STATUS_BADGES.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Delivery ETA (days)"
              type="number"
              value={draft.deliveryEtaDays ?? ''}
              onChange={(event) =>
                set('deliveryEtaDays', event.target.value ? Number(event.target.value) : null)
              }
              disabled={readOnly}
            />
            <TextField
              label="Location"
              value={draft.location ?? ''}
              onChange={(event) => set('location', event.target.value || null)}
              disabled={readOnly}
            />
            <TextField
              label="VIN"
              value={draft.vin ?? ''}
              onChange={(event) => set('vin', event.target.value || null)}
              disabled={readOnly}
            />
            <TextField
              label="Lot number"
              value={draft.lotNumber ?? ''}
              onChange={(event) => set('lotNumber', event.target.value || null)}
              disabled={readOnly}
            />
            <TextField
              label="Mileage (km)"
              type="number"
              value={draft.mileage ?? ''}
              onChange={(event) =>
                set('mileage', event.target.value ? Number(event.target.value) : null)
              }
              disabled={readOnly}
            />
            {canReadPartners && (
              <TextField
                label="Assigned partner"
                value={draft.partnerId ?? ''}
                onChange={(event) => set('partnerId', event.target.value || null)}
                select
                disabled={readOnly}
                helperText="The partner who sees this car in their portal."
              >
                <MenuItem value="">Nobody</MenuItem>
                {partners.map((partner) => (
                  <MenuItem key={partner.id} value={partner.id}>
                    {partner.name}
                    {partner.company ? ` — ${partner.company}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>

          <TextField
            label="Damage history"
            value={draft.damageHistory ?? ''}
            onChange={(event) => set('damageHistory', event.target.value || null)}
            multiline
            minRows={2}
            fullWidth
            disabled={readOnly}
            sx={{ mt: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={draft.featured}
                onChange={(event) => set('featured', event.target.checked)}
                disabled={readOnly}
              />
            }
            label="Featured on the homepage"
            sx={{ mt: 1 }}
          />
        </Section>

        <Section
          title="Colours"
          description="Order-only. The buyer picks one when the car is bought to order."
        >
          <ColourEditor
            colours={draft.colors}
            onChange={(colours) => set('colors', colours)}
            enabled={draft.condition === 'ON_ORDER'}
            readOnly={readOnly}
          />
        </Section>

        <Section
          title="Photos and video"
          description={
            creating ? 'Uploaded now, attached to the car as soon as it is created.' : undefined
          }
        >
          <ImageAlbums
            images={creating ? pendingImages : car!.images}
            readOnly={readOnly}
            onAdd={handleAddImage}
            onRemove={handleRemoveImage}
          />
        </Section>
      </Stack>

      {!readOnly && (
        <>
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button component={RouterLink} to="/cars" color="inherit">
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(draft)}
              disabled={saveMutation.isPending}
              variant="contained"
            >
              {saveMutation.isPending ? 'Saving…' : creating ? 'Create car' : 'Save'}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: description ? 0.5 : 2.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2.5 }}>
          {description}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}
