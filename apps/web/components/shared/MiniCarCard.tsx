import Link from 'next/link';
import type { Car } from '@/lib/types/car';
import { carHref, formatUsd } from '@/lib/types/car';
import { messages } from '@/lib/messages';

/**
 * Minimal car card — model name + total price only, per the Homepage/Featured
 * variant of `CarCard` in `components.md`. The full multi-context `CarCard`
 * (6 variants: list/offer/compare/etc.) is out of scope for the Homepage-only
 * build; this is intentionally the smaller Homepage-appropriate stand-in,
 * reused by both `FeaturedCars` and the `QuizPopup` results screen.
 */
export function MiniCarCard({ car }: { car: Car }) {
  return (
    <Link
      href={carHref(car)}
      className="group block overflow-hidden rounded-lg border border-line-light bg-white shadow-card transition-transform duration-standard ease-expo hover:-translate-y-1"
    >
      <div
        className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-ink via-surface to-muted/60 text-white/70"
        aria-hidden="true"
      >
        <CarGlyph />
      </div>
      <div className="p-4">
        <p className="font-display text-lead font-semibold text-ink">
          {car.make} {car.model}
        </p>
        <p className="mt-1 text-body text-muted">
          {messages.common.carCard.fromPrice} {formatUsd(car.price)}
        </p>
      </div>
    </Link>
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
