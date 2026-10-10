import type { Metadata } from 'next';
import { MiniCarCard } from '@/components/shared/MiniCarCard';
import { PromotionsSection } from '@/components/shared/PromotionsSection';
import { OffersFinalCta } from '@/components/shared/OffersFinalCta';
import { getFeaturedCars, listPromoCars } from '@/lib/cars';
import { getServerMessages } from '@/lib/i18n';

/** The design's 1344px column inside 48px gutters (Figma 1440 canvas). */
const COLUMN = 'mx-auto max-w-page px-4 sm:px-6 lg:px-12';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.offers.meta.title,
    description: messages.offers.meta.description,
  };
}

/**
 * Special offers `/offers` — `references/pages.md` "7. Special offers".
 * Figma node `124:662`/`124:669` ("featured cars" page, file
 * `9Lq4XpWusTJj1VnM6laAZr`), re-verified directly in Figma's Dev Mode
 * inspector (the MCP connector is broken in this environment) — a prior
 * pass's comment here claimed *both* sections reuse the same full `CarCard`
 * "confirmed by sharing the same Figma component instance", which doesn't
 * hold up: clicking the two sections' cards individually shows two
 * different node IDs with two different visual treatments.
 *
 * - S1 "Շաբաթվա լավագույն առաջարկները" — admin-featured cars. Figma's own
 *   card here (node ~`124:705`) is the plain full-bleed-photo /
 *   price+model-bottom-left / arrow-bottom-right treatment `MiniCarCard`'s
 *   own doc comment already describes verbatim as "the Figma 'Featured
 *   Cars' card treatment" — i.e. the *same* card Homepage's own
 *   `FeaturedCars` uses, not the badge-heavy China-list `CarCard`. Capped
 *   at 4 (`getFeaturedCars(4)`) with the exact gap Homepage's grid uses,
 *   rather than Homepage's own uncapped catalogue view.
 * - S2 "Ընթացիկ ակցիաներ" — `PromotionsSection`, which does correctly use
 *   the full `CarCard` (its badges/video-tag treatment matches Figma's
 *   promo cards, node ~`124:723`) — cars with both `oldPrice` and
 *   `promoDeadline` set, split into Current/Past tabs.
 * - S3 final CTA opens the Universal popup (not the Quiz) per the written
 *   spec — `OffersFinalCta`.
 */
export default async function OffersPage() {
  const [featured, promoCars, { messages }] = await Promise.all([
    getFeaturedCars(4),
    listPromoCars(),
    getServerMessages(),
  ]);
  const t = messages.offers;

  return (
    <>
      <h1 className="sr-only">{t.meta.title}</h1>
      {/* pt-32/pt-40 clears the fixed pill header — this page has no hero to
          borrow that clearance from, same as the China listing/About pages. */}
      {/* The first heading sits 221px down in the design (below the fixed header). */}
      <section className={`${COLUMN} bg-surface-light pt-32 text-ink sm:pt-[221px]`}>
        <h2 className="type-h2">{t.featured.heading}</h2>
        {featured.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:gap-x-12 lg:gap-y-8">
            {featured.map((car, index) => (
              <MiniCarCard
                key={car.id}
                car={car}
                imageSrc={car.images[0]?.url}
                priority={index === 0}
                figma
              />
            ))}
          </div>
        )}
      </section>

      <div className="bg-surface-light pb-16 lg:pb-[150px]">
        {promoCars.length > 0 && (
          <section className={`${COLUMN} pt-16 text-ink lg:pt-[150px]`}>
            <PromotionsSection cars={promoCars} />
          </section>
        )}
      </div>

      <OffersFinalCta />
    </>
  );
}
