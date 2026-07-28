import type { MessageKey } from '@/lib/i18n';

/**
 * The single car shape used by `CarCard`, `CarDetail`, `SimilarOffers`,
 * `FeaturedCars`, `CompareTool` and the lead popups.
 *
 * It is deliberately one type with optional branches rather than four types:
 * the same China car appears on a list, in a comparison and inside a popup, and
 * the USA/machinery variants only add fields. `variant` decides which spec rows
 * and CTAs a surface renders — see `SPEC_ROWS`.
 *
 * TODO(P7.3): this is fed by `data/cars.ts` stubs today; swap in the real
 * CMS/API source without changing the shape.
 */

export type CarVariant = 'china' | 'usa-auction' | 'usa-available' | 'machinery';
export type Powertrain = 'ev' | 'hybrid' | 'benzin';
export type CarCondition = 'in-stock' | 'on-order' | 'on-road' | 'auction';
export type AuctionPlatform = 'copart' | 'iaai' | 'manheim';
export type CarColorId = 'white' | 'black' | 'gray' | 'blue' | 'red';
/** Quiz question 3 — what the buyer needs the car for. */
export type CarUsage = 'city' | 'family' | 'travel';

export interface CarImages {
  exterior: string[];
  interior?: string[];
  details?: string[];
  /** Single video URL; renders as the 4th image tab when present. */
  video?: string;
}

/**
 * Flat spec bag — every field optional, because the four variants share only
 * make/model/year. `SPEC_ROWS` below fixes the order and the Armenian label per
 * variant, so a car never renders a row the spec did not ask for.
 */
export interface CarSpecs {
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  fuel?: string;
  range?: string;
  battery?: string;
  engine?: string;
  drivetrain?: string;
  transmission?: string;
  seats?: number;
  warranty?: string;
  vin?: string;
  lot?: string;
  mileage?: string;
  damage?: string;
  location?: string;
  // Machinery only.
  power?: string;
  weight?: string;
  operatingHours?: string;
  dimensions?: string;
  payload?: string;
}

export interface AuctionInfo {
  platform: AuctionPlatform;
  lot: string;
  /** ISO timestamp — drives the `Countdown` on auction cards. */
  endsAt: string;
  currentBid?: number;
  /**
   * Deep link to the lot. Copart/IAAI only: Manheim cards must not expose a
   * direct auction link (see the USA CTA logic in SKILL.md).
   */
  url?: string;
}

export interface OnRoadInfo {
  /** "Կհասնի ~X օրից" — ISO arrival estimate. */
  etaDate: string;
  status: 'ship' | 'poti' | 'customs';
}

export interface OfferInfo {
  oldPrice: number;
  /** ISO deadline — drives the offer `Countdown`. */
  endsAt: string;
}

/** One leg of `PriceJourney`; amounts in USD. */
export interface PriceStop {
  id: 'car' | 'inland' | 'freight' | 'customs';
  amount: number;
  /** Not every leg is a firm quote — flagged "մոտավոր" in the UI. */
  approximate?: boolean;
}

export interface Car {
  slug: string;
  variant: CarVariant;
  make: string;
  model: string;
  year: number;
  /** USD. For auction cars this is the current bid context, not the final cost. */
  price: number;
  /** Estimated all-in cost once the car is in Armenia (USD). */
  estimatedFinalPrice?: number;
  condition: CarCondition;
  powertrain?: Powertrain;
  usage?: CarUsage[];
  financingAvailable?: boolean;
  images: CarImages;
  specs: CarSpecs;
  /** Order-only cars let the buyer pick a colour; in-stock cars do not. */
  colors?: CarColorId[];
  /** Per-colour hero image; falls back to `images.exterior[0]`. */
  colorImages?: Partial<Record<CarColorId, string>>;
  priceJourney?: PriceStop[];
  auction?: AuctionInfo;
  onRoad?: OnRoadInfo;
  offer?: OfferInfo;
  /** Extra message keys rendered as badges next to the condition badge. */
  badges?: MessageKey[];
}

/** Route for a car, by variant. */
export function carHref(car: Car): string {
  switch (car.variant) {
    case 'china':
      return `/china/${car.slug}`;
    case 'usa-auction':
      return `/usa/auctions/${car.slug}`;
    case 'usa-available':
      return `/usa/available/${car.slug}`;
    case 'machinery':
      return `/machinery/${car.slug}`;
  }
}

export function carName(car: Car): string {
  return `${car.make} ${car.model}`;
}

/** Spec rows per variant, in the order `references/pages.md` lists them. */
export const SPEC_ROWS: Record<CarVariant, { field: keyof CarSpecs; labelKey: MessageKey }[]> = {
  china: [
    { field: 'make', labelKey: 'car.spec.make' },
    { field: 'model', labelKey: 'car.spec.model' },
    { field: 'year', labelKey: 'car.spec.year' },
    { field: 'trim', labelKey: 'car.spec.trim' },
    { field: 'fuel', labelKey: 'car.spec.fuel' },
    { field: 'range', labelKey: 'car.spec.range' },
    { field: 'battery', labelKey: 'car.spec.battery' },
    { field: 'engine', labelKey: 'car.spec.engine' },
    { field: 'drivetrain', labelKey: 'car.spec.drivetrain' },
    { field: 'seats', labelKey: 'car.spec.seats' },
    { field: 'warranty', labelKey: 'car.spec.warranty' },
  ],
  'usa-auction': [
    { field: 'make', labelKey: 'car.spec.make' },
    { field: 'model', labelKey: 'car.spec.model' },
    { field: 'year', labelKey: 'car.spec.year' },
    { field: 'vin', labelKey: 'car.spec.vin' },
    { field: 'mileage', labelKey: 'car.spec.mileage' },
    { field: 'engine', labelKey: 'car.spec.engine' },
    { field: 'fuel', labelKey: 'car.spec.fuel' },
    { field: 'drivetrain', labelKey: 'car.spec.drivetrain' },
    { field: 'transmission', labelKey: 'car.spec.transmission' },
    { field: 'damage', labelKey: 'car.spec.damage' },
    { field: 'location', labelKey: 'car.spec.location' },
  ],
  'usa-available': [
    { field: 'make', labelKey: 'car.spec.make' },
    { field: 'model', labelKey: 'car.spec.model' },
    { field: 'year', labelKey: 'car.spec.year' },
    { field: 'vin', labelKey: 'car.spec.vin' },
    { field: 'mileage', labelKey: 'car.spec.mileage' },
    { field: 'engine', labelKey: 'car.spec.engine' },
    { field: 'fuel', labelKey: 'car.spec.fuel' },
    { field: 'drivetrain', labelKey: 'car.spec.drivetrain' },
    { field: 'transmission', labelKey: 'car.spec.transmission' },
  ],
  machinery: [
    { field: 'make', labelKey: 'car.spec.manufacturer' },
    { field: 'model', labelKey: 'car.spec.model' },
    { field: 'year', labelKey: 'car.spec.year' },
    { field: 'engine', labelKey: 'car.spec.engine' },
    { field: 'power', labelKey: 'car.spec.power' },
    { field: 'weight', labelKey: 'car.spec.weight' },
    { field: 'operatingHours', labelKey: 'car.spec.operatingHours' },
    { field: 'fuel', labelKey: 'car.spec.fuel' },
    { field: 'dimensions', labelKey: 'car.spec.dimensions' },
    { field: 'payload', labelKey: 'car.spec.payload' },
  ],
};
