import Link from 'next/link';
import Image from 'next/image';
import type { Car } from '@/lib/types/car';
import { carHref, formatUsd } from '@/lib/types/car';
import { messages } from '@/lib/messages';

const t = messages.china.carCard;

/**
 * The full listing-grid car card — China (and later USA) page S2. Distinct
 * from `MiniCarCard` (Homepage/Featured, model+price only): this variant
 * carries the full detail the Figma "Porsche-style grid" calls for —
 * condition + financing badges, year/trim/price pills — per
 * `references/pages.md` China S2 and `components.md`'s `CarCard` "China
 * list" variant. Pixel-matched to Figma node 101:279 (file 9Lq4XpWusTJj1VnM6laAZr).
 */
export function CarCard({ car, priority = false }: { car: Car; priority?: boolean }) {
  const imageSrc = car.images[0]?.url;
  const infoPills = [
    car.year ? String(car.year) : null,
    car.trim ?? null,
    formatUsd(car.price),
  ].filter((v): v is string => Boolean(v));

  return (
    <Link
      href={carHref(car)}
      className="group relative block aspect-[3/2] w-full overflow-hidden rounded-xl bg-neutral-800 transition-transform duration-standard ease-expo hover:-translate-y-1"
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
          className="h-full w-full bg-gradient-to-br from-ink via-surface to-muted/60"
          aria-hidden="true"
        />
      )}

      {/* Bottom-heavy scrim, matches Figma's 3-stop gradient exactly. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black from-[8.565%] via-black/0 via-[41.654%] to-black/50 to-[89.231%]"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-[5px]">
          <span className="rounded-pill border border-white bg-white/10 px-[16px] py-[10px] text-[16px] font-medium leading-[20px] text-white">
            {t.conditions[car.condition]}
          </span>
          {car.financingAvailable && (
            <span className="rounded-pill border border-white bg-transparent px-[16px] py-[10px] text-[16px] font-medium leading-[20px] text-white">
              {t.financingAvailable}
            </span>
          )}
        </div>

        <div className="flex flex-col items-start gap-[10px]">
          <p className="font-display text-[24px] font-light leading-[36px] text-white">
            {car.make} {car.model}
          </p>
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-[2px]">
              {infoPills.map((label) => (
                <span
                  key={label}
                  className="rounded-pill bg-white/10 px-[10px] py-[10px] text-[16px] font-medium leading-[20px] text-white"
                >
                  {label}
                </span>
              ))}
            </div>
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 rotate-45 items-center justify-center rounded-pill bg-white/10 text-white transition-colors duration-standard group-hover:bg-accent group-hover:text-ink"
            >
              <ArrowGlyph />
            </span>
          </div>
        </div>
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
