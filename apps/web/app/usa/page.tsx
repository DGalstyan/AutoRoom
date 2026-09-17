import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { CarCard } from '@/components/shared/CarCard';
import { UsaHero } from '@/components/usa/UsaHero';
import { CustomsCalculator } from '@/components/usa/CustomsCalculator';
import { UsaStateClocks } from '@/components/usa/UsaStateClocks';
import { UsaImportProcess } from '@/components/usa/UsaImportProcess';
import { UsaFaq } from '@/components/usa/UsaFaq';
import { UsaFinalCta } from '@/components/usa/UsaFinalCta';
import { listCars } from '@/lib/cars';
import { getServerMessages } from '@/lib/i18n';
import type { Car } from '@/lib/types/car';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.usa.meta.title,
    description: messages.usa.meta.description,
  };
}

/**
 * `/usa` — `references/pages.md` "4. USA": S1 hero, S2.1 best-auctions
 * listing, S3 available-cars listing, S4 on-the-road listing, S5 state
 * clocks, S8 import-process timeline, S8c FAQ, S9 final CTA. Figma node
 * 218:177 (file 9Lq4XpWusTJj1VnM6laAZr) covers the whole page and gave real
 * pixel data for S1/S5 (see `UsaHero`/`UsaStateClocks`'s own doc comments);
 * S8 has no matching Figma node at all — see `UsaImportProcess`'s doc
 * comment — so it's built from the written spec alone. S2.4's customs
 * calculator lives at a different, unlinked Figma node (282:1699 — see
 * `CustomsCalculator`'s own doc comment for how that was found and why it
 * only hands off to a human rather than computing anything). Still not
 * built: the Useful-guides reels (S8b), which need dedicated video/embed
 * assets this pass doesn't have.
 *
 * Card grids reuse China's own listing pattern (`app/china/page.tsx`): a
 * 2-column `CarCard` grid, one `listCars` call per condition since the
 * public API has no "one call, three buckets" shape. `getFeaturedCars`
 * isn't used here — this page wants every matching car, not a capped
 * homepage-style highlight reel.
 */
export default async function UsaPage() {
  const { messages } = await getServerMessages();
  const t = messages.usa;

  const [{ items: auctionCars }, { items: availableCars }, { items: onRoadCars }] =
    await Promise.all([
      listCars({ origin: 'USA', condition: 'AUCTION', take: 24 }),
      listCars({ origin: 'USA', condition: 'IN_STOCK', take: 24 }),
      listCars({ origin: 'USA', condition: 'ON_ROAD', take: 24 }),
    ]);

  return (
    <>
      <UsaHero />

      <CarGridSection heading={t.bestAuctions.heading} cars={auctionCars} />

      <Section tone="light">
        <CustomsCalculator />
      </Section>

      <CarGridSection heading={t.availableCars.heading} cars={availableCars} />
      <CarGridSection heading={t.onRoad.heading} cars={onRoadCars} />

      <Section tone="light">
        <UsaStateClocks />
      </Section>

      <Section tone="light">
        <UsaImportProcess />
      </Section>

      <Section tone="light">
        <UsaFaq />
      </Section>

      <UsaFinalCta />
    </>
  );
}

/** One listing block: heading + 2-column `CarCard` grid, or nothing at all
 * when admin hasn't published any car in that bucket yet — `lib/cars.ts`'s
 * documented contract ("render nothing... when empty"), the same rule
 * already applied to Price Journey and the Offers promo grid elsewhere on
 * the site. */
function CarGridSection({ heading, cars }: { heading: string; cars: Car[] }) {
  if (cars.length === 0) return null;

  return (
    <Section tone="light">
      <h2 className="font-display text-home-h2 font-light text-ink">{heading}</h2>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {cars.map((car, index) => (
          <CarCard key={car.id} car={car} priority={index === 0} />
        ))}
      </div>
    </Section>
  );
}
