import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { errorMessage } from '@/lib/api';
import { brand } from '@/theme';

export interface Column<T> {
  /** Stable key — React's, and what `hidden` is applied to. */
  key: string;
  header?: ReactNode;
  render: (row: T) => ReactNode;
  /**
   * Present makes the header a sort control, and is the value handed back to
   * `onSortChange`. Absent means the column is not sortable — which is most of
   * them, since sorting happens on the server and only some columns are indexed.
   */
  sortKey?: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  /**
   * Drop the column entirely. For permission-gated data: rendering an empty cell
   * would leave a headed column that never has content, which reads as a bug.
   */
  hidden?: boolean;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  rowsPerPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

/**
 * The table every list screen renders.
 *
 * Server-side by design: sorting, filtering and paging are state the caller
 * owns and sends to the API, and this renders whatever comes back. Sorting a
 * page of 25 locally would silently sort a *slice*, which looks like sorting
 * until the data outgrows one page and then quietly lies.
 *
 * It also owns the four states a list can be in — loading, failed, empty, and
 * populated. Those were hand-written on every screen, which is how one page
 * ends up with a spinner and another with a blank rectangle.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isPending = false,
  error,
  emptyMessage = 'Nothing to show.',
  errorMessage: errorText = 'Could not load this list.',
  sort,
  onSortChange,
  pagination,
  toolbar,
  footer,
  minWidth = 720,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isPending?: boolean;
  error?: unknown;
  emptyMessage?: string;
  errorMessage?: string;
  sort?: SortState;
  onSortChange?: (key: string) => void;
  pagination?: PaginationState;
  /** Filters and search, above the table and inside the same card. */
  toolbar?: ReactNode;
  /** Extra row below the table, above pagination. */
  footer?: ReactNode;
  minWidth?: number;
  /** Makes each row open something (typically a detail page) on click.
   * A cell that needs its own click (an actions menu button, an inline
   * link) must call `event.stopPropagation()` or it also fires this. */
  onRowClick?: (row: T) => void;
}) {
  const visible = columns.filter((column) => !column.hidden);
  // Phones get a stacked card per row instead of a table that scrolls sideways.
  const theme = useTheme();
  const stacked = useMediaQuery(theme.breakpoints.down('md'));
  const sortable = visible.filter((column) => column.sortKey);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {toolbar && (
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
          {toolbar}
        </Stack>
      )}

      {isPending ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress size={22} thickness={5} sx={{ color: 'text.secondary' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 3 }}>
          {errorMessage(error, errorText)}
        </Alert>
      ) : rows.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8, px: 3 }}>
          {emptyMessage}
        </Typography>
      ) : stacked ? (
        <Box>
          {sortable.length > 0 && onSortChange && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${brand.lineLight}`,
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                Sort by
              </Typography>
              <Select
                size="small"
                value={sort?.key ?? ''}
                displayEmpty
                onChange={(event) => event.target.value && onSortChange(String(event.target.value))}
                sx={{ flex: 1, minWidth: 0 }}
                inputProps={{ 'aria-label': 'Sort by' }}
              >
                {sortable.map((column) => (
                  <MenuItem key={column.key} value={column.sortKey}>
                    {column.header}
                    {sort && sort.key === column.sortKey
                      ? sort.direction === 'asc'
                        ? ' ↑'
                        : ' ↓'
                      : ''}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          )}
          {rows.map((row) => {
            const labelled = visible.filter((column) => column.header);
            const bare = visible.filter((column) => !column.header);
            return (
              <Box
                key={getRowId(row)}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${brand.lineLight}`,
                  cursor: onRowClick ? 'pointer' : undefined,
                  '&:last-of-type': { borderBottom: 0 },
                  '&:active': onRowClick ? { bgcolor: 'action.hover' } : undefined,
                }}
              >
                <Stack spacing={1.25}>
                  {labelled.map((column, index) => (
                    <Box
                      key={column.key}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: index === 0 ? 'flex-start' : 'baseline',
                        justifyContent: 'space-between',
                        minWidth: 0,
                      }}
                    >
                      {index > 0 && (
                        <Typography
                          component="div"
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            flexShrink: 0,
                            maxWidth: '40%',
                          }}
                        >
                          {column.header}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          minWidth: 0,
                          overflowWrap: 'anywhere',
                          textAlign: index === 0 ? 'left' : 'right',
                          flex: index === 0 ? 1 : undefined,
                        }}
                      >
                        {column.render(row)}
                      </Box>
                    </Box>
                  ))}
                  {bare.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {bare.map((column) => (
                        <Box key={column.key}>{column.render(row)}</Box>
                      ))}
                    </Box>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth }}>
            <TableHead>
              <TableRow>
                {visible.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align}
                    sx={{ width: column.width }}
                    sortDirection={sort && column.sortKey === sort.key ? sort.direction : false}
                  >
                    {column.sortKey && onSortChange ? (
                      <TableSortLabel
                        active={sort?.key === column.sortKey}
                        direction={sort?.key === column.sortKey ? sort.direction : 'asc'}
                        onClick={() => onSortChange(column.sortKey!)}
                      >
                        {column.header}
                      </TableSortLabel>
                    ) : (
                      column.header
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {visible.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {footer}

      {/* Kept mounted through loading and empty states: a control that vanishes
          and reappears makes the card jump every time a filter changes. */}
      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          onPageChange={(_event, next) => pagination.onPageChange(next)}
          rowsPerPage={pagination.rowsPerPage}
          onRowsPerPageChange={(event) =>
            pagination.onRowsPerPageChange(Number(event.target.value))
          }
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Paper>
  );
}
