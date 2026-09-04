import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { CarCard } from '@/components/shared/CarCard';
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
 * Figma node `124:669` ("Featured cars", file `9Lq4XpWusTJj1VnM6laAZr`),
 * verified via get_metadata/get_design_context. Two data-driven sections
 * reuse the full `CarCard` (not the Homepage's minimal `MiniCarCard`) —
 * confirmed by both sharing the same Figma component instance:
 *
 * - S1 "Շաբաթվա լավագույն առաջարկները" — admin-featured cars, a fixed 2x2
 *   grid (48px column gap / 32px row gap, matching the exact asymmetric
 *   gap measured on the Homepage's own featured grid) rather than the
 *   Homepage's uncapped catalogue view.
 * - S2 "Ընթացիկ ակցիաներ" — `PromotionsSection`, cars with both `oldPrice`
 *   and `promoDeadline` set, split into Current/Past tabs.
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
          <div className="mt-10 grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-12">
            {featured.map((car, index) => (
              <CarCard key={car.id} car={car} priority={index === 0} />
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
