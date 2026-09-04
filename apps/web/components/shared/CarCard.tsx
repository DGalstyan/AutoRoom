import Link from 'next/link';
import Image from 'next/image';
import type { CarSummary } from '@/lib/types/car';
import { carHref, formatUsd } from '@/lib/types/car';
import { getServerMessages } from '@/lib/i18n';
import { PromoCountdown } from '@/components/shared/PromoCountdown';

/**
 * The full listing-grid car card — China (and later USA) page S2, and the
 * `/offers` page's featured-cars and promotions sections (which reuse this
 * exact card, not the Homepage's minimal `MiniCarCard` — confirmed by both
 * sections sharing the same Figma component instance, node 124:701/124:719).
 *
 * A car with `promoDeadline` set runs as a time-limited "Ակցիա": a red badge
 * + live countdown replace the usual condition/financing badges while the
 * deadline is still ahead (node `124:721`, verified via get_design_context),
 * and a grayscale "Ավարտված" treatment takes over once it's passed
 * (`references/pages.md` "Special offers" S2's Անցած-tab spec — not itself
 * pictured in Figma, so this part is inferred from the written spec).
 * `oldPrice` alone (no deadline) is just a permanent discount — the
 * struck-through price pill shows either way, with no badge or countdown.
 *
 * Distinct from `MiniCarCard` (Homepage/Featured, model+price only): this
 * variant carries the full detail the Figma "Porsche-style grid" calls for —
 * condition + financing badges, year/trim/price pills — per
 * `references/pages.md` China S2 and `components.md`'s `CarCard` "China
 * list" variant. Pixel-matched to Figma node 101:279 (file 9Lq4XpWusTJj1VnM6laAZr).
 */
export async function CarCard({ car, priority = false }: { car: CarSummary; priority?: boolean }) {
  const { messages } = await getServerMessages();
  const t = messages.china.carCard;
  const imageSrc = car.images[0]?.url;

  const hasDiscount = car.oldPrice != null && car.oldPrice > car.price;
  const deadline = car.promoDeadline ? new Date(car.promoDeadline) : null;
  const isPromo = hasDiscount && deadline !== null;
  const isPromoActive = isPromo && deadline.getTime() > new Date().getTime();
  const isPromoEnded = isPromo && !isPromoActive;

  const infoPills = [car.year ? String(car.year) : null, car.trim ?? null].filter(
    (v): v is string => Boolean(v),
  );

  return (
    <Link
      href={carHref(car)}
      className={`group relative block aspect-[3/2] w-full overflow-hidden rounded-xl bg-neutral-800 transition-transform duration-standard ease-expo hover:-translate-y-1 ${isPromoEnded ? 'grayscale' : ''}`}
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
          {isPromo ? (
            <>
              <span
                className={`rounded-pill px-[16px] py-[10px] text-[16px] font-bold leading-[20px] text-white ${isPromoActive ? 'bg-error' : 'bg-white/10'}`}
              >
                {isPromoActive ? t.promo : t.promoEnded}
              </span>
              {isPromoActive && (
                <span className="rounded-pill border border-white bg-transparent px-[16px] py-[10px] text-[16px] font-medium leading-[20px] text-white">
                  <PromoCountdown deadline={car.promoDeadline!} />
                </span>
              )}
            </>
          ) : (
            <>
              <span className="rounded-pill border border-white bg-white/10 px-[16px] py-[10px] text-[16px] font-medium leading-[20px] text-white">
                {t.conditions[car.condition]}
              </span>
              {car.financingAvailable && (
                <span className="rounded-pill border border-white bg-transparent px-[16px] py-[10px] text-[16px] font-medium leading-[20px] text-white">
                  {t.financingAvailable}
                </span>
              )}
            </>
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
              <span className="flex items-center gap-[10px] rounded-pill bg-white/10 px-[10px] py-[10px] text-[16px] font-medium leading-[20px]">
                {hasDiscount && (
                  <span className="text-white line-through">{formatUsd(car.oldPrice!)}</span>
                )}
                <span className={hasDiscount ? 'text-error' : 'text-white'}>
                  {formatUsd(car.price)}
                </span>
              </span>
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
