import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section } from '@/components/ui/Section';
import { CarDetailHero } from '@/components/shared/CarDetailHero';
import { LoanCalculator } from '@/components/shared/LoanCalculator';
import { SimilarOffers } from '@/components/shared/SimilarOffers';
import { getCarBySlug, listSimilarCars } from '@/lib/cars';
import { getBanks } from '@/lib/banks';
import { getFinanceCalculatorSettings } from '@/lib/settings';
import { formatUsd } from '@/lib/types/car';

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
    description: `${car.make} ${car.model}, ${car.year} — ${formatUsd(car.price)}: մանրամասներ, ֆինանսավորում և առաքման ժամկետ ԱՄՆ-ից AutoRoom-ի միջոցով։`,
  };
}

/**
 * USA available/on-the-road car detail `/usa/available/[slug]` —
 * `references/pages.md` "4. USA" S3.2.1/S3.2.2. Reuses the exact same
 * `CarDetailHero`/`LoanCalculator`/`SimilarOffers` the China detail page
 * uses (`carHref` already pointed every non-auction USA car here — this
 * page just didn't exist yet, so every featured/listed USA car 404'd on
 * click). No `PriceJourney` here — that's a China-only concept per the
 * spec, and `car.priceJourney` is simply empty for USA cars regardless.
 *
 * `notFound()` on an `AUCTION` car: that condition has its own route
 * (`/usa/auctions/[slug]`) with its own guard the other way, so a mistyped
 * URL for the wrong condition 404s instead of silently rendering.
 */
export default async function UsaAvailableCarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car || car.condition === 'AUCTION') notFound();

  const [similarCars, banks, finance] = await Promise.all([
    listSimilarCars(car),
    getBanks(),
    getFinanceCalculatorSettings(),
  ]);

  return (
    <>
      <Section tone="light" className="pt-32 sm:pt-40">
        <CarDetailHero car={car} banks={banks} />
      </Section>

      <Section tone="light">
        <div className="flex flex-col gap-24 sm:gap-[150px]">
          <LoanCalculator car={car} finance={finance} />
          <SimilarOffers cars={similarCars} />
        </div>
      </Section>
    </>
  );
}
