import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { MiniCarCard } from '@/components/shared/MiniCarCard';
import { PromotionsSection } from '@/components/shared/PromotionsSection';
import { OffersFinalCta } from '@/components/shared/OffersFinalCta';
import { getFeaturedCars, listPromoCars } from '@/lib/cars';
import { getServerMessages } from '@/lib/i18n';

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
      {/* pt-32/pt-40 clears the fixed pill header — this page has no hero to
          borrow that clearance from, same as the China listing/About pages. */}
      <Section tone="light" className="pt-32 sm:pt-40">
        <h2 className="font-display text-home-h2 font-light text-ink">{t.featured.heading}</h2>
        {featured.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-x-12">
            {featured.map((car, index) => (
              <MiniCarCard
                key={car.id}
                car={car}
                imageSrc={car.images[0]?.url}
                priority={index === 0}
              />
            ))}
          </div>
        )}
      </Section>

      {promoCars.length > 0 && (
        <Section tone="light">
          <PromotionsSection cars={promoCars} />
        </Section>
      )}

      <OffersFinalCta />
    </>
  );
}
