import type { CarSummary } from '@/lib/types/car';
import { CarCard } from '@/components/shared/CarCard';
import { getServerMessages } from '@/lib/i18n';

/**
 * "Նմանատիպ առաջարկներ" — China/USA car-detail S3.6. Reuses the
 * same `CarCard` as the listing grid rather than a bespoke card, per
 * `components.md`'s "One component" principle. Renders nothing when
 * `lib/cars.ts`'s `listSimilarCars` found no comparable inventory, matching
 * every other data-driven section's empty-state contract. Left-aligned
 * heading and a 48px grid gap, matching the other left-aligned S3.5/S3.6b
 * headings on this page (Figma node 102:332/102:334-335).
 */
export async function SimilarOffers({ cars }: { cars: CarSummary[] }) {
  if (cars.length === 0) return null;
  const { messages } = await getServerMessages();
  const t = messages.common.carDetail.similarOffers;

  return (
    <div className="flex flex-col gap-8 lg:gap-16">
      <h2 className="stretch-88 text-[28px] font-light leading-[38px] text-neutral-900 sm:text-home-h2 sm:leading-[58px]">
        {t.heading}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-12">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} badgesEnd />
        ))}
      </div>
    </div>
  );
}
