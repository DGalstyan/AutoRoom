import type {
  Car,
  CarCondition,
  CarInput,
  CarOrigin,
  CarStatusBadge,
  ImageAlbum,
  Powertrain,
} from '@autoroom/api/client';

/**
 * Display labels for the enums the API speaks.
 *
 * Kept in one module so the list, the filters and the form cannot drift into
 * calling the same value different things.
 */

export const ORIGINS: { value: CarOrigin; label: string }[] = [
  { value: 'CHINA', label: 'China' },
  { value: 'USA', label: 'USA' },
];

export const CONDITIONS: { value: CarCondition; label: string; hint: string }[] = [
  { value: 'IN_STOCK', label: 'In stock', hint: 'Already in Armenia' },
  { value: 'ON_ORDER', label: 'On order', hint: 'Bought to order — colour choice applies' },
  { value: 'ON_ROAD', label: 'On the road', hint: 'Shipped, not yet arrived' },
  { value: 'AUCTION', label: 'Auction', hint: 'A USA auction lot' },
];

export const STATUS_BADGES: { value: CarStatusBadge; label: string }[] = [
  { value: 'NA_NAVUM', label: 'Նավում — on the ship' },
  { value: 'POTI', label: 'Poti' },
  { value: 'CUSTOMS', label: 'Customs' },
];

export const POWERTRAINS: { value: Powertrain; label: string }[] = [
  { value: 'EV', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'BENZIN', label: 'Petrol' },
];

export const ALBUMS: { value: ImageAlbum; label: string; hint: string }[] = [
  { value: 'EXTERIOR', label: 'Exterior', hint: 'The gallery the card and detail page lead with.' },
  { value: 'INTERIOR', label: 'Interior', hint: 'Cabin, seats, dashboard.' },
  { value: 'DETAILS', label: 'Details', hint: 'Close-ups — wheels, badges, trim.' },
  { value: 'VIDEO', label: 'Video', hint: 'Walkarounds. MP4 or WebM.' },
  { value: 'AUCTION', label: 'Auction', hint: 'Lot photos as they appeared at auction.' },
  { value: 'RECEIPT', label: 'Receipt', hint: 'Purchase paperwork.' },
  {
    value: 'HANDOVER',
    label: 'Handover',
    hint: 'Uploaded in Gyumri when the container is opened.',
  },
];

export const CONDITION_LABEL = Object.fromEntries(
  CONDITIONS.map((entry) => [entry.value, entry.label]),
) as Record<CarCondition, string>;

export const ORIGIN_LABEL = Object.fromEntries(
  ORIGINS.map((entry) => [entry.value, entry.label]),
) as Record<CarOrigin, string>;

/** `Zeekr 001 2024` → `zeekr-001-2024`. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatMoney(amount: number | null | undefined, currency = '$') {
  if (amount === null || amount === undefined) return '—';
  return `${currency}${amount.toLocaleString('en-US')}`;
}

/**
 * Strips the server-owned fields so a full `Car` can be sent back through
 * `update`, which — unlike `setPartner`/`setPublished` — takes the whole
 * record. Shared by every screen that patches one field of an already-loaded
 * car (the list's featured toggle, the similar-cars picker) without routing
 * the viewer through the full edit form.
 */
export function toCarInput(car: Car): CarInput {
  const { id, publishedAt, images, createdAt, updatedAt, similarCars, ...input } = car;
  void id;
  void publishedAt;
  void images;
  void createdAt;
  void updatedAt;
  return { ...input, similarCarIds: similarCars.map((similar) => similar.id) };
}
