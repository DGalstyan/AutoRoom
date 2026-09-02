import type { CarSummary } from '@/lib/types/car';
import { CarCard } from '@/components/shared/CarCard';
import { getServerMessages } from '@/lib/i18n';

/**
 * "Նմանատիպ առաջարկներ" — China (and later USA) car-detail S3.6. Reuses the
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
  const t = messages.china.detail.similarOffers;

  return (
    <div className="flex flex-col gap-12">
      <h2 className="font-display text-home-h2 font-light text-neutral-900">{t.heading}</h2>
      <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </div>
  );
}
