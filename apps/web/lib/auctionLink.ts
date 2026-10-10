/**
 * Where a USA auction car's «Տեսնել մեքենան օնլայն» button goes.
 *
 * When staff have set a View-Only link the public API withholds it (`hasGuestAccess`) and the
 * button goes through `/usa/auctions/[slug]/view`, which issues a temporary access. Otherwise, Copart and
 * IAAI listings still get a working link built from the platform and the lot number, falling
 * back to the platform's own site so the button never dead-ends. Manheim is dealer-only with no
 * public listing page, so it gets no link (as the spec says).
 */
import type { AuctionPlatform, Car } from '@/lib/types/car';

type AuctionLinkCar = Pick<Car, 'auctionViewUrl' | 'auctionPlatform' | 'lotNumber'> &
  Partial<Pick<Car, 'slug' | 'hasGuestAccess'>>;

const PLATFORM_HOME: Record<Exclude<AuctionPlatform, 'MANHEIM'>, string> = {
  COPART: 'https://www.copart.com/',
  IAAI: 'https://www.iaai.com/',
};

/** Only http(s) links are ever rendered: a stray `javascript:` value from admin must not become a href. */
function safeHttpUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function auctionViewLink(car: AuctionLinkCar): string | null {
  // The admin's View-Only link is never public: guests go through a time-limited access route.
  if (car.hasGuestAccess && car.slug) return `/usa/auctions/${encodeURIComponent(car.slug)}/view`;

  const explicit = safeHttpUrl(car.auctionViewUrl);
  if (explicit) return explicit;

  const platform = car.auctionPlatform;
  if (platform !== 'COPART' && platform !== 'IAAI') return null;

  const lot = car.lotNumber?.trim().replace(/\D/g, '');
  if (lot) {
    return platform === 'COPART'
      ? `https://www.copart.com/lot/${lot}`
      : `https://www.iaai.com/VehicleDetail/${lot}~US`;
  }
  return PLATFORM_HOME[platform];
}
