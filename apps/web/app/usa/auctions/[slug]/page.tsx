import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CarDetailHero } from '@/components/shared/CarDetailHero';
import { AuctionFollowAlong } from '@/components/shared/AuctionFollowAlong';
import { AuctionHowItWorks } from '@/components/shared/AuctionHowItWorks';
import { CustomsCalculator } from '@/components/usa/CustomsCalculator';
import { getCarBySlug } from '@/lib/cars';
import { getBanks } from '@/lib/banks';
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
 * "4. USA" S2.2/S2.3. Reuses the same shared hero/specs/financing/similar-
 * cars treatment as `/usa/available/[slug]` and the China detail page
 * (`carHref` already pointed every `AUCTION`-condition USA car here — this
 * page just didn't exist yet, so it 404'd on click).
 *
 * After the hero (Figma "USA Inner" 448:13816): `AuctionFollowAlong` (the View-Only
 * guest-login text), the black `AuctionHowItWorks` band with the two CTAs, then the
 * customs calculator — the design has no loan calculator or similar-offers block here. Still not built: the platform badge
 * (Copart/IAAI/Manheim) and the platform-conditional CTA logic (Manheim
 * gets no direct view-online link) — needs an `auctionPlatform` field the
 * `Car` model doesn't carry yet, a separate, larger effort; see
 * `AuctionFollowAlong`'s own doc comment.
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

  const banks = await getBanks();

  return (
    <>
      <div className="bg-surface-light">
        <div className="mx-auto max-w-page px-4 pt-32 sm:px-6 sm:pt-[185px] lg:px-12">
          <CarDetailHero car={car} banks={banks} />
        </div>
      </div>

      <div className="bg-surface-light">
        <div className="mx-auto max-w-page px-4 pb-14 pt-14 sm:px-6 lg:px-12 lg:pb-[102px] lg:pt-[102px]">
          <AuctionFollowAlong />
        </div>
      </div>

      <AuctionHowItWorks car={car} />

      <div className="bg-surface-light">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-12 lg:pb-[150px] lg:pt-[102px]">
          <CustomsCalculator />
        </div>
      </div>
    </>
  );
}
