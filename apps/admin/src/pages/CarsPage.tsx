import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Car, CarCondition, CarListQuery, CarOrigin } from '@autoroom/api/client';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { AssignPartnerDialog } from '@/pages/cars/AssignPartnerDialog';
import {
  CONDITIONS,
  CONDITION_LABEL,
  ORIGINS,
  ORIGIN_LABEL,
  formatMoney,
} from '@/pages/cars/carOptions';
import { brand, mono } from '@/theme';

type SortKey = NonNullable<CarListQuery['sort']>;

/**
 * The catalogue.
 *
 * Filtering, sorting and paging are all server-side — the table sends its state
 * as query parameters and renders what comes back, rather than fetching
 * everything and slicing locally. A catalogue is expected to outgrow one page.
 */
export function CarsPage() {
  const { api, identity } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /**
   * The partner filter lives in the URL, not just in state: the Partners screen
   * links straight to "Sevan Auto's cars", and that link has to survive being
   * shared, bookmarked, or reloaded.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerId = searchParams.get('partnerId') ?? '';

  const [origin, setOrigin] = useState<CarOrigin | ''>('');
  const [condition, setCondition] = useState<CarCondition | ''>('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState<'' | 'true' | 'false'>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('createdAt');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [menu, setMenu] = useState<{ anchor: HTMLElement; car: Car } | null>(null);
  const [deleting, setDeleting] = useState<Car | null>(null);
  const [assigning, setAssigning] = useState<Car | null>(null);

  const canCreate = identity?.permissions.includes('cars:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('cars:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('cars:DELETE') ?? false;
  const canPublish = identity?.permissions.includes('cars:PUBLISH') ?? false;
  const canReadPartners = identity?.permissions.includes('partners:READ') ?? false;

  /** Writing the filter also resets to page 1 — page 4 of a narrower list is rarely there. */
  function setPartnerFilter(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next) params.set('partnerId', next);
    else params.delete('partnerId');
    setSearchParams(params, { replace: true });
    setPage(0);
  }

  const query: CarListQuery = {
    ...(origin ? { origin } : {}),
    ...(condition ? { condition } : {}),
    ...(partnerId ? { partnerId } : {}),
    ...(featured ? { featured: true } : {}),
    ...(published ? { published: published === 'true' } : {}),
    ...(search ? { search } : {}),
    sort,
    direction,
    take: rowsPerPage,
    skip: page * rowsPerPage,
  };

  const carsQuery = useQuery({
    queryKey: ['cars', query],
    queryFn: () => api.cars.list(query),
  });

  // Only fetched when the viewer may read partners — otherwise the request
  // would 403 and the assign action is hidden anyway.
  const partnersQuery = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.partners.list({ take: 100 }),
    enabled: canReadPartners,
  });

  /**
   * Partner counts on the Partners screen come from the same rows, so a
   * reassignment has to invalidate both or that list keeps showing the old
   * "3 cars" until something else happens to refetch it.
   */
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['cars'] });
    void queryClient.invalidateQueries({ queryKey: ['partners'] });
  };

  const featureMutation = useMutation({
    mutationFn: (car: Car) => api.cars.update(car.id, { ...toInput(car), featured: !car.featured }),
    onSuccess: (car) => {
      toast(car.featured ? `${car.make} ${car.model} is now featured.` : 'Removed from featured.');
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const publishMutation = useMutation({
    mutationFn: ({ car, publish }: { car: Car; publish: boolean }) =>
      api.cars.setPublished(car.id, publish),
    onSuccess: (car) => {
      toast(car.publishedAt ? 'Published.' : 'Unpublished — hidden from the site.');
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.cars.remove(id),
    onSuccess: () => {
      toast('Car deleted.');
      setDeleting(null);
      void refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  function sortBy(key: SortKey) {
    if (sort === key) setDirection(direction === 'asc' ? 'desc' : 'asc');
    else {
      setSort(key);
      setDirection('asc');
    }
    setPage(0);
  }

  const cars = carsQuery.data?.items ?? [];

  return (
    <Box sx={{ maxWidth: 1320 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}
      >
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Cars
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            The catalogue behind the China and USA sections.
          </Typography>
        </Box>

        {canCreate && (
          <Button
            component={RouterLink}
            to="/cars/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ flex: 'none' }}
          >
            Add car
          </Button>
        )}
      </Stack>

      <DataTable
        rows={cars}
        getRowId={(car) => car.id}
        isPending={carsQuery.isPending}
        error={carsQuery.isError ? carsQuery.error : undefined}
        errorMessage="Could not load cars."
        emptyMessage="No cars match these filters."
        minWidth={900}
        sort={{ key: sort, direction }}
        onSortChange={(key) => sortBy(key as SortKey)}
        pagination={{
          page,
          rowsPerPage,
          total: carsQuery.data?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (next) => {
            setRowsPerPage(next);
            setPage(0);
          },
        }}
        toolbar={
          <>
            <TextField
              label="Search"
              placeholder="Make, model, slug or VIN"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ minWidth: 240, flex: 1 }}
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
              label="Condition"
              value={condition}
              onChange={(event) => {
                setCondition(event.target.value as CarCondition | '');
                setPage(0);
              }}
              select
              size="small"
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Any</MenuItem>
              {CONDITIONS.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>
            {canReadPartners && (
              <TextField
                label="Partner"
                value={partnerId}
                onChange={(event) => setPartnerFilter(event.target.value)}
                select
                size="small"
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="none">Unassigned</MenuItem>
                {(partnersQuery.data?.items ?? []).map((partner) => (
                  <MenuItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="State"
              value={published}
              onChange={(event) => {
                setPublished(event.target.value as '' | 'true' | 'false');
                setPage(0);
              }}
              select
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="true">Published</MenuItem>
              <MenuItem value="false">Draft</MenuItem>
            </TextField>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Switch
                checked={featured}
                onChange={(event) => {
                  setFeatured(event.target.checked);
                  setPage(0);
                }}
                size="small"
                inputProps={{ 'aria-label': 'Featured only' }}
              />
              <Typography sx={{ fontSize: '0.875rem' }}>Featured only</Typography>
            </Stack>
          </>
        }
        columns={[
          {
            key: 'cover',
            width: 64,
            render: (car) => {
              const cover = car.images.find((image) => image.album === 'EXTERIOR');
              return (
                <Box
                  sx={{
                    width: 48,
                    height: 34,
                    borderRadius: 1,
                    bgcolor: brand.surfaceLight,
                    border: `1px solid ${brand.lineLight}`,
                    overflow: 'hidden',
                  }}
                >
                  {cover && (
                    <Box
                      component="img"
                      src={cover.url}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </Box>
              );
            },
          },
          {
            key: 'car',
            header: 'Car',
            sortKey: 'make',
            render: (car) => (
              <>
                <Typography
                  component={RouterLink}
                  to={`/cars/${car.id}`}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'inherit',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {car.make} {car.model} {car.year}
                </Typography>
                <Typography sx={{ fontFamily: mono, fontSize: '0.75rem', color: 'text.secondary' }}>
                  {car.slug}
                </Typography>
              </>
            ),
          },
          {
            key: 'origin',
            header: 'Origin',
            render: (car) => (
              <Typography sx={{ fontSize: '0.875rem' }}>{ORIGIN_LABEL[car.origin]}</Typography>
            ),
          },
          {
            key: 'condition',
            header: 'Condition',
            render: (car) => (
              <Typography sx={{ fontSize: '0.875rem' }}>
                {CONDITION_LABEL[car.condition]}
              </Typography>
            ),
          },
          {
            key: 'price',
            header: 'Price',
            sortKey: 'price',
            align: 'right',
            render: (car) => (
              <Typography sx={{ fontSize: '0.875rem' }}>{formatMoney(car.price)}</Typography>
            ),
          },
          {
            key: 'partner',
            header: 'Partner',
            hidden: !canReadPartners,
            render: (car) =>
              car.partner ? (
                <>
                  <Typography sx={{ fontSize: '0.875rem' }}>{car.partner.name}</Typography>
                  {car.partner.company && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {car.partner.company}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  Unassigned
                </Typography>
              ),
          },
          {
            key: 'featured',
            header: 'Featured',
            align: 'center',
            render: (car) => (
              <IconButton
                size="small"
                disabled={!canUpdate || featureMutation.isPending}
                onClick={() => featureMutation.mutate(car)}
                aria-label={car.featured ? 'Remove from featured' : 'Mark as featured'}
              >
                {car.featured ? (
                  <StarIcon fontSize="small" sx={{ color: brand.warn }} />
                ) : (
                  <StarBorderIcon fontSize="small" sx={{ color: brand.muted }} />
                )}
              </IconButton>
            ),
          },
          {
            key: 'state',
            header: 'State',
            render: (car) => (
              <StatusBadge
                label={car.publishedAt ? 'Published' : 'Draft'}
                tone={car.publishedAt ? 'live' : 'muted'}
              />
            ),
          },
          {
            key: 'actions',
            align: 'right',
            render: (car) => (
              <IconButton
                size="small"
                aria-label={`Actions for ${car.make} ${car.model}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, car })}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            ),
          },
        ]}
      />

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) navigate(`/cars/${menu.car.id}`);
            setMenu(null);
          }}
        >
          {canUpdate ? 'Edit' : 'View'}
        </MenuItem>

        {canUpdate && canReadPartners && menu && (
          <MenuItem
            onClick={() => {
              setAssigning(menu.car);
              setMenu(null);
            }}
          >
            {menu.car.partnerId ? 'Reassign partner' : 'Assign to partner'}
          </MenuItem>
        )}

        {canPublish && menu && (
          <MenuItem
            onClick={() => {
              publishMutation.mutate({ car: menu.car, publish: !menu.car.publishedAt });
              setMenu(null);
            }}
          >
            {menu.car.publishedAt ? 'Unpublish' : 'Publish'}
          </MenuItem>
        )}

        {canDelete && menu && (
          <MenuItem
            onClick={() => {
              setDeleting(menu.car);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {assigning && (
        <AssignPartnerDialog
          car={assigning}
          partners={partnersQuery.data?.items ?? []}
          onClose={() => setAssigning(null)}
          onDone={(message) => {
            setAssigning(null);
            toast(message);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this car?"
        message={
          deleting
            ? `${deleting.make} ${deleting.model} ${deleting.year} and its images will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}

/** Strips the server-owned fields so a car can be sent back as an update. */
function toInput(car: Car) {
  const { id, publishedAt, images, createdAt, updatedAt, ...input } = car;
  void id;
  void publishedAt;
  void images;
  void createdAt;
  void updatedAt;
  return input;
}
