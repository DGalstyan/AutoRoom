import { useMemo, useState } from 'react';
import type { Booking } from '@autoroom/api/client';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { brand, mono } from '@/theme';
import { statusTone } from '@/pages/bookings/status';
import { toneColor } from '@/components/StatusBadge';
import { dayKey, formatTime } from '@/pages/availability/time';

const WEEK_STARTS_MONDAY = 1;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * A month grid of appointments.
 *
 * The list answers "what is outstanding"; this answers "how busy is the 14th",
 * which is the question a diary is usually opened for and the one a table
 * sorted by timestamp answers worst. Clicking a booking opens the same editor
 * the list uses — the two views are presentations of one set of rows, not two
 * features.
 */
export function BookingCalendar({
  bookings,
  onSelect,
}: {
  bookings: Booking[];
  onSelect: (booking: Booking) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  /** Appointments bucketed by local calendar day. */
  const byDay = useMemo(() => {
    const buckets = new Map<string, Booking[]>();
    for (const booking of bookings) {
      const key = dayKey(booking.scheduledAt);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(booking);
      else buckets.set(key, [booking]);
    }
    for (const bucket of buckets.values()) {
      bucket.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    }
    return buckets;
  }, [bookings]);

  const cells = useMemo(() => monthGrid(month), [month]);
  const todayKey = dayKey(new Date().toISOString());
  const monthIndex = month.getMonth();

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', p: 2, borderBottom: `1px solid ${brand.lineLight}` }}
      >
        <IconButton
          size="small"
          aria-label="Previous month"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontWeight: 600, minWidth: 170, textAlign: 'center' }}>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton
          size="small"
          aria-label="Next month"
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        <Button
          size="small"
          color="inherit"
          onClick={() => setMonth(startOfMonth(new Date()))}
          sx={{ ml: 1 }}
        >
          Today
        </Button>
      </Stack>

      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 720 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {DAY_LABELS.map((label) => (
              <Typography
                key={label}
                sx={{
                  px: 1,
                  py: 1,
                  fontFamily: mono,
                  fontSize: '0.6875rem',
                  color: 'text.secondary',
                  textAlign: 'center',
                  borderBottom: `1px solid ${brand.lineLight}`,
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((date) => {
              const key = dayKey(date.toISOString());
              const dayBookings = byDay.get(key) ?? [];
              const outside = date.getMonth() !== monthIndex;

              return (
                <Box
                  key={key}
                  sx={{
                    minHeight: 104,
                    p: 0.75,
                    borderBottom: `1px solid ${brand.lineLight}`,
                    borderRight: `1px solid ${brand.lineLight}`,
                    bgcolor: outside ? brand.surfaceLight : 'transparent',
                    opacity: outside ? 0.55 : 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: mono,
                      fontSize: '0.6875rem',
                      mb: 0.5,
                      textAlign: 'right',
                      color: key === todayKey ? brand.accent : 'text.secondary',
                      fontWeight: key === todayKey ? 700 : 400,
                    }}
                  >
                    {date.getDate()}
                  </Typography>

                  <Stack spacing={0.5}>
                    {dayBookings.slice(0, 3).map((booking) => {
                      const entry = statusTone(booking.status);
                      const color = toneColor(entry.tone);
                      return (
                        <Box
                          key={booking.id}
                          component="button"
                          type="button"
                          onClick={() => onSelect(booking)}
                          title={`${booking.partner.name} — ${entry.label}`}
                          sx={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            border: 'none',
                            borderLeft: `3px solid ${color}`,
                            borderRadius: '3px',
                            px: 0.75,
                            py: 0.375,
                            cursor: 'pointer',
                            font: 'inherit',
                            fontSize: '0.6875rem',
                            lineHeight: 1.3,
                            bgcolor: `${color}14`,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: `${color}26` },
                          }}
                        >
                          <Box component="span" sx={{ fontFamily: mono, opacity: 0.8 }}>
                            {formatTime(booking.scheduledAt)}
                          </Box>{' '}
                          {booking.partner.name}
                        </Box>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', pl: 0.75 }}>
                        +{dayBookings.length - 3} more
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/**
 * Six weeks of local dates covering the month, padded from the preceding
 * Monday. Always six rows so the grid does not change height between months —
 * a calendar that jumps as you page through it is hard to scan.
 */
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const lead = (first.getDay() - WEEK_STARTS_MONDAY + 7) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead);

  return Array.from(
    { length: 42 },
    (_unused, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}
