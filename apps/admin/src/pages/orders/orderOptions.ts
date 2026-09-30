import type {
  DocumentKind,
  InspectionStatus,
  OrderStageName,
  PaymentStatus,
} from '@autoroom/api/client';
import type { StatusTone } from '@/components/StatusBadge';

/**
 * Display labels for the order enums the API speaks — the admin-panel
 * (English) counterparts to the partner-portal's Armenian ones. Kept in one
 * module so the list, the filters and the detail page cannot drift into
 * calling the same value different things.
 */

export const STAGES: { value: OrderStageName; label: string }[] = [
  { value: 'CREATED', label: 'Created' },
  { value: 'LOADING', label: 'Loading' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'ARRIVED', label: 'Arrived in Armenia' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export const STAGE_LABEL = Object.fromEntries(
  STAGES.map((entry) => [entry.value, entry.label]),
) as Record<OrderStageName, string>;

export const STAGE_TONE: Record<OrderStageName, StatusTone> = {
  CREATED: 'muted',
  LOADING: 'pending',
  IN_TRANSIT: 'info',
  ARRIVED: 'info',
  DELIVERED: 'live',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PARTIAL: 'Partially paid',
  PAID: 'Paid',
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  PENDING: 'danger',
  PARTIAL: 'pending',
  PAID: 'live',
};

export const DOCUMENT_KINDS: { value: DocumentKind; label: string }[] = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'CUSTOMS', label: 'Customs' },
  { value: 'TITLE', label: 'Title' },
  { value: 'BILL_OF_SALE', label: 'Bill of sale' },
  { value: 'OTHER', label: 'Other' },
];

export const DOCUMENT_KIND_LABEL = Object.fromEntries(
  DOCUMENT_KINDS.map((entry) => [entry.value, entry.label]),
) as Record<DocumentKind, string>;

export const INSPECTION_STATUSES: { value: InspectionStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
];

export const INSPECTION_STATUS_LABEL = Object.fromEntries(
  INSPECTION_STATUSES.map((entry) => [entry.value, entry.label]),
) as Record<InspectionStatus, string>;
