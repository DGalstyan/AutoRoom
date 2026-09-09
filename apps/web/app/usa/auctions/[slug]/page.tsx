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
    description: `${car.make} ${car.model}, ${car.year} — ${formatUsd(car.price)}: աճուրդային մեքենայի մանրամասներ, ֆինանսավորում և առաքման ժամկետ ԱՄՆ-ից AutoRoom-ի միջոցով։`,
  };
}

/**
 * USA auction car detail `/usa/auctions/[slug]` — `references/pages.md`
 * "4. USA" S2.2. Reuses the same shared hero/specs/financing/similar-cars
 * treatment as `/usa/available/[slug]` and the China detail page (`carHref`
 * already pointed every `AUCTION`-condition USA car here — this page just
 * didn't exist yet, so it 404'd on click).
 *
 * The full auction-specific experience the spec also calls for — the
 * platform badge (Copart/IAAI/Manheim), "Տեսնել մեքենան օնլայն" View-Only
 * guest-login access, and the platform-conditional CTA logic — needs an
 * `auctionPlatform` field the `Car` model doesn't carry yet, so it's not
 * built here; this page covers the base case (real specs, financing,
 * similar cars, a working page instead of a 404) and leaves the
 * platform-specific follow-along flow for that larger, separate effort.
 *
 * `notFound()` on a non-`AUCTION` car: that's `/usa/available/[slug]`'s
 * job, with its own guard the other way.
 */
export default async function UsaAuctionCarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car || car.condition !== 'AUCTION') notFound();

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
