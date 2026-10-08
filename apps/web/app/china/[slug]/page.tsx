import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CarDetailHero } from '@/components/shared/CarDetailHero';
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
    id: car.id,
    name: `${car.make} ${car.model}`,
    vin: car.vin ?? undefined,
    lot: car.lotNumber ?? undefined,
    price: formatUsd(car.price),
    image: car.images[0]?.url,
    url: carHref(car),
  };

  return (
    <>
      {/* The design's 1344px column inside 48px gutters; the title bar sits 185px
          down (Figma 442:9407), clearing the fixed pill header. */}
      <div className="bg-surface-light">
        <div className="mx-auto max-w-page px-4 pt-32 sm:px-6 sm:pt-[185px] lg:px-12">
          <CarDetailHero car={car} banks={banks} />
        </div>
      </div>

      {/* One block for the three lower sections — the design's 150px gap between
          them is a single frame, not three independently-padded sections. */}
      <div className="bg-surface-light">
        <div className="mx-auto max-w-page px-4 pb-14 pt-14 sm:px-6 lg:px-12 lg:pb-24 lg:pt-[102px]">
          <div className="flex flex-col gap-24 sm:gap-[150px]">
            {car.priceJourney.length > 0 && (
              <PriceJourney chips={car.priceJourney} car={carContext} />
            )}
            <LoanCalculator car={car} finance={finance} />
            <SimilarOffers cars={similarCars} />
          </div>
        </div>
      </div>
    </>
  );
}
