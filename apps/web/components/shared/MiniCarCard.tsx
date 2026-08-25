import Link from 'next/link';
import Image from 'next/image';
import type { Car } from '@/lib/types/car';
import { carHref, formatUsd } from '@/lib/types/car';
import { messages } from '@/lib/messages';

/**
 * Minimal car card — model name + total price only, per the Homepage/Featured
 * variant of `CarCard` in `components.md`. The full multi-context `CarCard`
 * (6 variants: list/offer/compare/etc.) is out of scope for the Homepage-only
 * build; this is intentionally the smaller Homepage-appropriate stand-in,
 * reused by both `FeaturedCars` and the `QuizPopup` results screen.
 *
 * `imageSrc` matches the Figma "Featured Cars" card treatment (full-bleed
 * photo, bottom-left price/model over a dark scrim, circular arrow link
 * bottom-right) when supplied; falls back to the glyph placeholder where no
 * real photo exists yet (e.g. quiz results for mock cars without art).
 */
export function MiniCarCard({
  car,
  imageSrc,
  priority = false,
}: {
  car: Car;
  imageSrc?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={carHref(car)}
      className="group relative block aspect-[3/2] w-full overflow-hidden rounded-xl bg-neutral-800 shadow-card transition-transform duration-standard ease-expo hover:-translate-y-1"
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={`${car.make} ${car.model}`}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink via-surface to-muted/60 text-white/70"
          aria-hidden="true"
        >
          <CarGlyph />
        </div>
      )}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-6 sm:bottom-6">
        <div>
          <p className="text-small font-medium text-white/90">
            {messages.common.carCard.fromPrice} {formatUsd(car.price)}
          </p>
          <p className="font-display text-home-card-title font-normal text-white">
            {car.make} {car.model}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-white/15 text-white backdrop-blur transition-colors duration-standard group-hover:bg-accent group-hover:text-ink"
        >
          <ArrowGlyph />
        </span>
      </div>
    </Link>
  );
}

function ArrowGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 12 12 4M12 4H5M12 4v7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CarGlyph() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="16.5" r="1.5" fill="currentColor" />
      <circle cx="17" cy="16.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
