import type { Car } from '@/lib/types/car';
import { CarCard } from '@/components/shared/CarCard';
import { messages } from '@/lib/messages';

const t = messages.china.detail.similarOffers;

/**
 * "Նմանատիպ առաջարկներ" — China (and later USA) car-detail S3.6. Reuses the
 * same `CarCard` as the listing grid rather than a bespoke card, per
 * `components.md`'s "One component" principle. Renders nothing when
 * `lib/cars.ts`'s `listSimilarCars` found no comparable inventory, matching
 * every other data-driven section's empty-state contract.
 */
export function SimilarOffers({ cars }: { cars: Car[] }) {
  if (cars.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </div>
  );
}
