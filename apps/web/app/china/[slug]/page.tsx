import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section } from '@/components/ui/Section';
import { CarDetailHero } from '@/components/china/CarDetailHero';
import { PriceJourney } from '@/components/shared/PriceJourney';
import { LoanCalculator } from '@/components/shared/LoanCalculator';
import { SimilarOffers } from '@/components/shared/SimilarOffers';
import { getCarBySlug, listSimilarCars } from '@/lib/cars';
import { getBanks } from '@/lib/banks';
import { getFinanceCalculatorSettings } from '@/lib/settings';
import { carHref, formatUsd } from '@/lib/types/car';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return {};

  return {
    title: `${car.make} ${car.model} — AutoRoom`,
    description: `${car.make} ${car.model}, ${car.year} — ${formatUsd(car.price)}: մանրամասներ, ֆինանսավորում և առաքման ժամկետ Չինաստանից AutoRoom-ի միջոցով։`,
  };
}

/**
 * China car detail `/china/[slug]` — `references/pages.md` "China car
 * detail" (S3.1–3.6b), pixel-matched to Figma node 102:195/102:476/102:220
 * (file 9Lq4XpWusTJj1VnM6laAZr) via `get_design_context` + screenshot.
 *
 * `notFound()` covers both "no such car" and "not yet published" identically,
 * since `getCarBySlug` already can't distinguish them (the public API
 * refuses to leak an unpublished row either way).
 */
export default async function CarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const [similarCars, banks, finance] = await Promise.all([
    listSimilarCars(car),
    getBanks(),
    getFinanceCalculatorSettings(),
  ]);

  const carContext = {
    name: `${car.make} ${car.model}`,
    price: formatUsd(car.price),
    image: car.images[0]?.url,
    url: carHref(car),
  };

  const finalAmount =
    car.estFinalPriceAM ?? car.priceJourney.reduce((sum, chip) => sum + chip.amount, 0);

  return (
    <>
      {/* pt-32/pt-40 clears the fixed pill header — see the listing page's
          identical comment for why this page needs it and the Homepage doesn't. */}
      <Section tone="light" className="pt-32 sm:pt-40">
        <CarDetailHero car={car} banks={banks} />
      </Section>

      {/* One Section for the three lower blocks — Figma's own 150px gap
          between them (node 102:220's `gap-[150px]`) is a single frame, not
          three independently-padded sections. */}
      <Section tone="light">
        <div className="flex flex-col gap-24 sm:gap-[150px]">
          {car.priceJourney.length > 0 && (
            <PriceJourney chips={car.priceJourney} finalAmount={finalAmount} car={carContext} />
          )}
          <LoanCalculator car={car} finance={finance} />
          <SimilarOffers cars={similarCars} />
        </div>
      </Section>
    </>
  );
}
