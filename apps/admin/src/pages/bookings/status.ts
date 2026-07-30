import type { BookingStatus } from '@autoroom/api/client';
import { brand } from '@/theme';

/**
 * The four booking states and how each one reads. Shared, so the list, the
 * calendar and the edit dialog cannot drift into calling the same status
 * different things or colouring it differently.
 */
export const STATUSES: { value: BookingStatus; label: string; color: string }[] = [
  { value: 'REQUESTED', label: 'Requested', color: brand.warn },
  { value: 'CONFIRMED', label: 'Confirmed', color: brand.success },
  { value: 'COMPLETED', label: 'Completed', color: brand.info },
  { value: 'CANCELLED', label: 'Cancelled', color: brand.muted },
];

export const statusTone = (status: BookingStatus) =>
  STATUSES.find((entry) => entry.value === status)!;
