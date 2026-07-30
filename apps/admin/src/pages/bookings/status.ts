import type { BookingStatus } from '@autoroom/api/client';
import type { StatusTone } from '@/components/StatusBadge';

/**
 * The four booking states and how each one reads. Shared, so the list, the
 * calendar and the edit dialog cannot drift into calling the same status
 * different things or colouring it differently.
 *
 * Each carries a `tone` rather than a hex: the meaning is the shared thing, and
 * what "live" looks like belongs to `StatusBadge`.
 */
export const STATUSES: { value: BookingStatus; label: string; tone: StatusTone }[] = [
  { value: 'REQUESTED', label: 'Requested', tone: 'pending' },
  { value: 'CONFIRMED', label: 'Confirmed', tone: 'live' },
  { value: 'COMPLETED', label: 'Completed', tone: 'info' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'muted' },
];

export const statusTone = (status: BookingStatus) =>
  STATUSES.find((entry) => entry.value === status)!;
