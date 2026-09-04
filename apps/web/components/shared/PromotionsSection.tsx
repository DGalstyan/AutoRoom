import { CarCard } from '@/components/shared/CarCard';
import { PromoTabs } from '@/components/shared/PromoTabs';
import { getServerMessages } from '@/lib/i18n';
import type { Car } from '@/lib/types/car';

/**
 * "Ընթացիկ ակցիաներ" — `/offers` S2 (`references/pages.md`). `cars` is
 * already the full promo list from `listPromoCars` (both current and past);
 * split here into the two tabs by comparing each car's own `promoDeadline`
 * against request time, same "derive status from the deadline, never store
 * one" contract `CarCard` itself follows for its badge/grayscale state.
 * Renders nothing when there are no promos at all — same empty-state
 * contract as every other admin-managed section on the site.
 */
export async function PromotionsSection({ cars }: { cars: Car[] }) {
  if (cars.length === 0) return null;
  const { messages } = await getServerMessages();
  const t = messages.offers.promotions;

  const now = new Date().getTime();
  const current = cars.filter((car) => new Date(car.promoDeadline!).getTime() > now);
  const past = cars.filter((car) => new Date(car.promoDeadline!).getTime() <= now);

  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>
      <div className="mt-10">
        <PromoTabs
          currentLabel={t.tabCurrent}
          pastLabel={t.tabPast}
          currentCount={current.length}
          pastCount={past.length}
          currentContent={
            current.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {current.map((car, index) => (
                  <CarCard key={car.id} car={car} priority={index === 0} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-lead text-muted">{t.emptyCurrent}</p>
            )
          }
          pastContent={
            past.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {past.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-lead text-muted">{t.emptyPast}</p>
            )
          }
        />
      </div>
    </div>
  );
}
