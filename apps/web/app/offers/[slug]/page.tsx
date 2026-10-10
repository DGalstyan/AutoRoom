import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OfferActions } from '@/components/shared/OfferActions';
import { Price } from '@/components/ui/Price';
import { getCarBySlug } from '@/lib/cars';
import { formatArrivalDate } from '@/lib/arrival';
import { getServerMessages } from '@/lib/i18n';
import { interpolate } from '@/lib/messages';
import { promoPoints, promoStatus, savings } from '@/lib/promo';
import { carHref, formatUsd } from '@/lib/types/car';

export const dynamic = 'force-dynamic';

/** A promotion is a car with a struck-through old price above its price AND a deadline. */
async function getOffer(slug: string) {
  const car = await getCarBySlug(slug);
  if (!car || !car.promoDeadline || !(car.oldPrice != null && car.oldPrice > car.price))
    return null;
  return car;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const car = await getOffer(slug);
  if (!car) return {};
  return {
    title: `${car.make} ${car.model} — ${formatUsd(car.price)} | AutoRoom`,
    // An ended offer stays reachable for anyone with the link, but is not worth indexing.
    robots:
      promoStatus(car.promoDeadline) === 'expired' ? { index: false, follow: true } : undefined,
  };
}

/**
 * Offer detail `/offers/[slug]`: the promotion's price and savings, its deadline, the terms and who
 * can take part (admin text per language, neutral default wording when blank) and the lead button.
 * Lifecycle is derived from `promoDeadline` (see `lib/promo.ts`): live → ending soon → expired,
 * and `OfferActions` closes the offer in the browser at the deadline without a reload.
 */
export default async function OfferDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getOffer(slug);
  if (!car) notFound();

  const { messages, locale } = await getServerMessages();
  const t = messages.offers.detail;
  const status = promoStatus(car.promoDeadline)!;
  const expired = status === 'expired';
  const saved = savings(car.price, car.oldPrice);
  const deadlineDay = car.promoDeadline!.slice(0, 10);
  const image = car.images[0]?.url;

  const carContext = {
    id: car.id,
    name: `${car.make} ${car.model}`,
    vin: car.vin ?? undefined,
    lot: car.lotNumber ?? undefined,
    price: formatUsd(car.price),
    image,
    url: `/offers/${car.slug}`,
  };

  return (
    <div className="bg-surface-light pb-16 text-ink lg:pb-[150px]">
      <div className="mx-auto flex max-w-page flex-col gap-8 px-4 pt-32 sm:px-6 sm:pt-[185px] lg:gap-12 lg:px-12">
        <Link
          href="/offers"
          className="inline-flex min-h-11 w-fit items-center gap-2 text-[14px] text-neutral-700 hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          {t.back}
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <div
            className={`relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-neutral-800 ${expired ? 'grayscale' : ''}`}
          >
            {image && (
              <Image
                src={image}
                alt={`${car.make} ${car.model}`}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-6">
            <h1 className="stretch-90 text-[32px] font-medium leading-10 text-neutral-900 sm:text-[44px] sm:leading-[56px]">
              {car.make} {car.model}
            </h1>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Price size="lg" className={expired ? 'text-neutral-600' : 'text-neutral-900'}>
                  {formatUsd(car.price)}
                </Price>
                <span className="text-[16px] text-neutral-600 line-through tabular-nums">
                  <span className="sr-only">{t.oldPrice}: </span>
                  {formatUsd(car.oldPrice!)}
                </span>
              </div>
              {saved && (
                <p className="text-[14px] font-medium text-neutral-800">
                  {interpolate(t.saving, {
                    amount: formatUsd(saved.amount),
                    percent: String(saved.percent),
                  })}
                </p>
              )}
              <p className="text-[14px] text-neutral-700">
                {interpolate(expired ? t.endedOn : t.validUntil, {
                  date: formatArrivalDate(deadlineDay),
                })}
              </p>
            </div>

            <OfferActions
              deadline={car.promoDeadline!}
              initialExpired={expired}
              car={carContext}
              carHref={carHref(car)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <PointsCard
            title={t.termsTitle}
            points={promoPoints(car.promoTerms, locale, t.termsDefault)}
          />
          <PointsCard
            title={t.eligibilityTitle}
            points={promoPoints(car.promoEligibility, locale, t.eligibilityDefault)}
          />
        </div>
      </div>
    </div>
  );
}

function PointsCard({ title, points }: { title: string; points: string[] }) {
  return (
    <section className="flex flex-col gap-4 rounded-[24px] bg-white p-6 lg:p-8">
      <h2 className="text-[20px] font-bold leading-7 text-neutral-900">{title}</h2>
      <ul className="flex flex-col gap-3">
        {points.map((point) => (
          <li key={point} className="type-body flex items-start gap-3 text-neutral-800">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
