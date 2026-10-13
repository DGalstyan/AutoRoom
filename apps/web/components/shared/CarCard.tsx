import { LoadingImage } from '@/components/ui/LoadingImage';
import Link from 'next/link';
import type { CarSummary } from '@/lib/types/car';
import { carHref, formatUsd } from '@/lib/types/car';
import { Price } from '@/components/ui/Price';
import { getServerMessages } from '@/lib/i18n';
import { interpolate } from '@/lib/messages';
import { PromoCountdown } from '@/components/shared/PromoCountdown';
import { CarCompareToggle } from '@/components/shared/CarCompareToggle';
import { CardArrow } from '@/components/ui/CardArrow';

/**
 * The full listing-grid car card — China (and later USA) page S2, and the
 * `/offers` page's promotions section only (node ~`124:723`). The featured-
 * cars section on that same page uses the plain `MiniCarCard` instead — a
 * prior pass's claim here that both `/offers` sections share this exact
 * component was wrong (re-checked directly in Figma's Dev Mode inspector:
 * the two sections are visibly different cards with different node IDs).
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
 *
 * The USA "on the road" section (`references/pages.md` S4) adds two more
 * optional pills — `statusBadge` (Նավում/Փոթի/Մաքսազերծում) and a
 * `deliveryEtaDays` countdown — in the same badge row. Both fields are
 * unset on every other card on the site, so this never shows outside that
 * one section; not pictured in Figma (only the written spec covers S4), so
 * styled to match the existing condition/financing pills rather than a new
 * pixel spec.
 */
export async function CarCard({
  car,
  priority = false,
  badgesEnd = false,
  heavyTopScrim = false,
  href,
}: {
  car: CarSummary;
  priority?: boolean;
  /** China listing (Figma 438:1181): badges sit at the card's top-right and the title is regular weight. */
  badgesEnd?: boolean;
  /** USA listing (Figma 440:3162): the scrim also goes solid black at the top edge. */
  heavyTopScrim?: boolean;
  /** Overrides where the card links (the Offers list sends promotions to `/offers/[slug]`). */
  href?: string;
}) {
  const { messages } = await getServerMessages();
  const t = messages.common.carCard;
  const compareT = messages.common.compare;
  // The full photo, not the 480px list thumbnail: these cards are 648px wide and the thumbnail looked soft.
  const imageSrc = car.images[0]?.url ?? car.images[0]?.thumbnailUrl;

  const hasDiscount = car.oldPrice != null && car.oldPrice > car.price;
  const deadline = car.promoDeadline ? new Date(car.promoDeadline) : null;
  const isPromo = hasDiscount && deadline !== null;
  const isPromoActive = isPromo && deadline.getTime() > new Date().getTime();
  const isPromoEnded = isPromo && !isPromoActive;

  // Four or more chips (condition, financing, status/ETA, compare) do not fit one 648px row at 16px
  // in Armenian, and the compare chip would drop onto the photo; they tighten up instead.
  const crowded =
    !isPromo &&
    [car.financingAvailable, car.statusBadge, car.deliveryEtaDays != null].filter(Boolean).length >=
      2;

  const infoPills = [car.year ? String(car.year) : null, car.trim ?? null].filter(
    (v): v is string => Boolean(v),
  );

  return (
    <div
      className={`group relative block aspect-[4/5] w-full overflow-hidden rounded-xl sm:aspect-[3/2] transition-transform duration-standard ease-expo hover:-translate-y-1 ${isPromoEnded ? 'bg-black' : 'bg-neutral-800'}`}
    >
      {/* The card's link is a sibling of the compare button, not its parent (a button inside
          a link is invalid HTML): it stretches over the whole card, and the button sits above it. */}
      <Link
        href={href ?? carHref(car)}
        className="absolute inset-0 z-[1] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="sr-only">
          {car.make} {car.model}
        </span>
      </Link>
      {imageSrc ? (
        <LoadingImage
          src={imageSrc}
          alt={`${car.make} ${car.model}`}
          priority={priority}
          sizes="(min-width: 1024px) 648px, 100vw"
          className={`object-cover ${isPromoEnded ? 'mix-blend-luminosity' : ''}`}
        />
      ) : (
        <div
          className="h-full w-full bg-gradient-to-br from-ink via-surface to-muted/60"
          aria-hidden="true"
        />
      )}

      {/* Bottom-heavy scrim, matches Figma's 3-stop gradient exactly. */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black from-[8.565%] via-black/0 via-[41.654%] to-[89.231%] ${heavyTopScrim || isPromoEnded ? 'to-black' : 'to-black/50'}`}
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
        <div
          className={`flex flex-wrap items-center gap-[5px] ${badgesEnd ? 'justify-end' : ''} ${crowded ? 'sm:[&>*]:!px-3 sm:[&>*]:!text-[14px] sm:[&>*]:!leading-5' : ''}`}
        >
          {isPromo ? (
            <>
              {/* Figma 439:2655/2657: 10px all round. Ended promotions keep the red badge and swap the countdown for "ended". */}
              <span className="rounded-pill bg-error p-[10px] text-[16px] font-bold leading-[20px] text-white">
                {t.promo}
              </span>
              <span className="rounded-pill border border-white bg-transparent p-[10px] text-[16px] font-medium leading-[20px] text-white">
                {isPromoActive ? <PromoCountdown deadline={car.promoDeadline!} /> : t.promoEnded}
              </span>
            </>
          ) : (
            <>
              {car.condition === 'AUCTION' && car.auctionPlatform ? (
                <span className="rounded-pill border border-white bg-white/10 px-[16px] py-[10px] text-[16px] max-sm:px-3 max-sm:py-2 max-sm:text-[14px] max-sm:leading-5 leading-[20px] text-white">
                  <span className="font-bold">{t.auctionPrefix} </span>
                  {t.platformDeal[car.auctionPlatform]}
                </span>
              ) : (
                <span className="rounded-pill border border-white bg-white/10 px-[16px] py-[10px] text-[16px] max-sm:px-3 max-sm:py-2 max-sm:text-[14px] max-sm:leading-5 font-medium leading-[20px] text-white">
                  {t.conditions[car.condition]}
                </span>
              )}
              {car.financingAvailable && (
                <span className="rounded-pill border border-white bg-transparent px-[16px] py-[10px] text-[16px] max-sm:px-3 max-sm:py-2 max-sm:text-[14px] max-sm:leading-5 font-medium leading-[20px] text-white">
                  {t.financingAvailable}
                </span>
              )}
              {/* On-the-road cars only (references/pages.md USA S4): shipping-
                  stage badge (Նավում/Փոթի/Մաքսազերծում) and an ETA pill —
                  both optional admin fields, so they simply don't render for
                  every other card on the site that leaves them unset. */}
              {car.statusBadge && (
                <span className="rounded-pill border border-white bg-transparent px-[16px] py-[10px] text-[16px] max-sm:px-3 max-sm:py-2 max-sm:text-[14px] max-sm:leading-5 font-medium leading-[20px] text-white">
                  {t.statusBadges[car.statusBadge]}
                </span>
              )}
              {car.deliveryEtaDays != null && (
                <span className="rounded-pill border border-white bg-transparent px-[16px] py-[10px] text-[16px] max-sm:px-3 max-sm:py-2 max-sm:text-[14px] max-sm:leading-5 font-medium leading-[20px] text-white">
                  {interpolate(t.etaDays, { days: String(car.deliveryEtaDays) })}
                </span>
              )}
            </>
          )}
          {/* Not on promotion cards: the design's badge row there is the badge and the countdown only. */}
          {!isPromo && (
            <CarCompareToggle
              className="pointer-events-auto relative z-[2]"
              compact={crowded}
              car={{
                id: car.id,
                slug: car.slug,
                make: car.make,
                model: car.model,
                year: car.year,
                imageUrl: imageSrc,
                origin: car.origin,
                condition: car.condition,
              }}
              label={compareT.toggle}
              labelSelected={compareT.toggleSelected}
            />
          )}
        </div>

        <div className="flex flex-col items-start gap-[10px]">
          <p
            className={`font-display text-[24px] leading-[36px] text-white ${badgesEnd ? 'font-normal' : 'font-light'}`}
          >
            {car.make} {car.model}
          </p>
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-[2px]">
              {infoPills.map((label) => (
                <span
                  key={label}
                  className="rounded-pill bg-white/10 px-[10px] py-[10px] text-[16px] max-sm:py-2 max-sm:text-[14px] font-medium leading-[20px] text-white"
                >
                  {label}
                </span>
              ))}
              <span className="flex items-center gap-[10px] rounded-pill bg-white/10 px-[10px] py-[10px] text-[16px] max-sm:py-2 max-sm:text-[14px] font-medium leading-[20px]">
                {hasDiscount && (
                  <span className="tabular-nums text-white line-through">
                    {formatUsd(car.oldPrice!)}
                  </span>
                )}
                {hasDiscount ? (
                  <span className="tabular-nums text-error">{formatUsd(car.price)}</span>
                ) : (
                  <Price className="text-white">{formatUsd(car.price)}</Price>
                )}
              </span>
            </div>
            <CardArrow />
          </div>
        </div>
      </div>
    </div>
  );
}
