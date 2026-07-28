import { CarCard } from '@/components/shared/CarCard';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Car } from '@/types/car';

/**
 * "Շաբաթվա լավագույն առաջարկները" — Homepage Section 2 and the top of the
 * Offers page.
 *
 * The two surfaces differ only in how much the card shows: the Homepage strip is
 * deliberately minimal (model name + total price), while the Offers page needs
 * the struck old price and the deadline countdown. That is the `context` prop on
 * `CarCard`, so this component stays a layout.
 */

export interface FeaturedCarsProps {
  cars: Car[];
  title?: string;
  /** `offer` shows struck price + deadline; `featured` shows name + price only. */
  context?: 'featured' | 'offer';
  className?: string;
  children?: React.ReactNode;
}

export function FeaturedCars({
  cars,
  title,
  context = 'featured',
  className,
  children,
}: FeaturedCarsProps) {
  if (cars.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-8', className)}>
      <h2 className="text-h2">{title ?? t('home.featuredTitle')}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cars.map((car, index) => (
          <CarCard key={car.slug} car={car} context={context} priority={index < 2} />
        ))}
      </div>
      {children}
    </section>
  );
}
