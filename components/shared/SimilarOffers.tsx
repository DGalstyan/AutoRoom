import { CarCard } from '@/components/shared/CarCard';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Car } from '@/types/car';

/**
 * "Նմանատիպ առաջարկներ" — 3–4 cars of the same class/budget/fuel under a car
 * detail. Selection happens in `data/cars.ts` (`getSimilarCars`) so the
 * component stays a pure list.
 */
export function SimilarOffers({ cars, className }: { cars: Car[]; className?: string }) {
  if (cars.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-6', className)}>
      <h2 className="text-h2">{t('car.similarTitle')}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cars.map((car) => (
          <CarCard key={car.slug} car={car} context="compact" />
        ))}
      </div>
    </section>
  );
}
