import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Car, CarCondition, CarListQuery, CarOrigin } from '@autoroom/api/client';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
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

  const canCreate = identity?.permissions.includes('cars:CREATE') ?? false;
  const canUpdate = identity?.permissions.includes('cars:UPDATE') ?? false;
  const canDelete = identity?.permissions.includes('cars:DELETE') ?? false;
  const canPublish = identity?.permissions.includes('cars:PUBLISH') ?? false;

  const query: CarListQuery = {
    ...(origin ? { origin } : {}),
    ...(condition ? { condition } : {}),
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

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cars'] });

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

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{
            p: 2,
            borderBottom: `1px solid ${brand.lineLight}`,
            alignItems: { md: 'center' },
            flexWrap: 'wrap',
          }}
        >
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
        </Stack>

        {carsQuery.isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
          </Box>
        ) : carsQuery.isError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {errorMessage(carsQuery.error, 'Could not load cars.')}
          </Alert>
        ) : cars.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
            No cars match these filters.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 64 }} />
                  <TableCell sortDirection={sort === 'make' ? direction : false}>
                    <TableSortLabel
                      active={sort === 'make'}
                      direction={sort === 'make' ? direction : 'asc'}
                      onClick={() => sortBy('make')}
                    >
                      Car
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Origin</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell sortDirection={sort === 'price' ? direction : false} align="right">
                    <TableSortLabel
                      active={sort === 'price'}
                      direction={sort === 'price' ? direction : 'asc'}
                      onClick={() => sortBy('price')}
                    >
                      Price
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Featured</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {cars.map((car) => {
                  const cover = car.images.find((image) => image.album === 'EXTERIOR');
                  return (
                    <TableRow key={car.id} hover>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
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
                        <Typography
                          sx={{ fontFamily: mono, fontSize: '0.75rem', color: 'text.secondary' }}
                        >
                          {car.slug}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {ORIGIN_LABEL[car.origin]}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {CONDITION_LABEL[car.condition]}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.875rem' }}>
                        {formatMoney(car.price)}
                      </TableCell>
                      <TableCell align="center">
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
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={car.publishedAt ? 'Published' : 'Draft'}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: car.publishedAt ? brand.success : brand.muted,
                            bgcolor: `${car.publishedAt ? brand.success : brand.muted}18`,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label={`Actions for ${car.make} ${car.model}`}
                          onClick={(event) => setMenu({ anchor: event.currentTarget, car })}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        <TablePagination
          component="div"
          count={carsQuery.data?.total ?? 0}
          page={page}
          onPageChange={(_event, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) navigate(`/cars/${menu.car.id}`);
            setMenu(null);
          }}
        >
          {canUpdate ? 'Edit' : 'View'}
        </MenuItem>

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
