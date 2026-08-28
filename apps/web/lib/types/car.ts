/**
 * Car shape — mirrors `apps/api/src/routes/cars.ts` (`serializeCar`) and the
 * Prisma enums in `apps/api/prisma/schema.prisma`, so swapping the mock data
 * source (`lib/data/mockCars.ts`) for `GET /public/cars` later is a drop-in.
 *
 * Until the public API client exists, this file — not memory — is the
 * contract every car-rendering component (`CarCard`, `FeaturedCars`, future
 * `CarDetail`) should import from.
 */

export type CarOrigin = 'CHINA' | 'USA';

export type CarCondition = 'IN_STOCK' | 'ON_ORDER' | 'ON_ROAD' | 'AUCTION';

export type CarStatusBadge = 'NA_NAVUM' | 'POTI' | 'CUSTOMS';

export type Powertrain = 'EV' | 'HYBRID' | 'BENZIN';

export type ImageAlbum = 'EXTERIOR' | 'INTERIOR' | 'DETAILS' | 'VIDEO' | 'AUCTION' | 'RECEIPT';

export interface CarColor {
  name: string;
  hex: string;
  imageUrl?: string | null;
}

export interface PriceChip {
  label: string;
  amount: number;
  note?: string | null;
}

export interface CarImage {
  id: string;
  carId: string;
  album: ImageAlbum;
  url: string;
  position: number;
}

export interface Car {
  id: string;
  slug: string;
  origin: CarOrigin;
  make: string;
  model: string;
  year: number;
  trim?: string | null;

  powertrain: Powertrain;
  range?: number | null;
  battery?: string | null;
  engine?: string | null;
  drivetrain?: string | null;
  transmission?: string | null;
  seats?: number | null;
  warranty?: string | null;

  vin?: string | null;
  lotNumber?: string | null;
  mileage?: number | null;

  price: number;
  oldPrice?: number | null;
  estFinalPriceAM?: number | null;

  condition: CarCondition;
  statusBadge?: CarStatusBadge | null;
  deliveryEtaDays?: number | null;
  location?: string | null;
  damageHistory?: string | null;
  financingAvailable: boolean;
  featured: boolean;

  colors: CarColor[];
  priceJourney: PriceChip[];
  images: CarImage[];

  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `finance.calculator` admin setting — drives `LoanCalculator`. */
export interface FinanceCalculator {
  termMonths: number;
  /** Percent, e.g. `15.9`. */
  nominalRate: number;
  effectiveRateMin: number;
  effectiveRateMax: number;
  /** Fraction of car price, e.g. `0.1` for 10%. */
  minDownPaymentRatio: number;
  maxDownPaymentRatio: number;
  defaultDownPaymentRatio: number;
  usdToAmd: number;
  disclaimer: string | null;
}

/** Where a `CarCard`/`FeaturedCars` link should point (future car-detail routes). */
export function carHref(car: Pick<Car, 'origin' | 'condition' | 'slug'>): string {
  if (car.origin === 'CHINA') return `/china/${car.slug}`;
  return car.condition === 'AUCTION' ? `/usa/auctions/${car.slug}` : `/usa/available/${car.slug}`;
}

export function formatUsd(amount: number): string {
  return `${amount.toLocaleString('en-US')} $`;
}
