import type { LeadStatus } from '@autoroom/api/client';
import type { StatusTone } from '@/components/StatusBadge';

/**
 * The three lead states and how each one reads — shared so the inbox list
 * and the row menu cannot drift into calling the same status different
 * things or colouring it differently. Mirrors `BookingsPage`'s
 * `pages/bookings/status.ts` pattern exactly.
 */
export const STATUSES: { value: LeadStatus; label: string; tone: StatusTone }[] = [
  { value: 'NEW', label: 'New', tone: 'live' },
  { value: 'CONTACTED', label: 'Contacted', tone: 'info' },
  { value: 'CLOSED', label: 'Closed', tone: 'muted' },
];

export const statusTone = (status: LeadStatus) => STATUSES.find((entry) => entry.value === status)!;
