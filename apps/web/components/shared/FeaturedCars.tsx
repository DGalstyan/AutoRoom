import { MiniCarCard } from '@/components/shared/MiniCarCard';
import { getFeaturedCars } from '@/lib/data/mockCars';
import { messages } from '@/lib/messages';

const t = messages.home.featured;

/**
 * PLACEHOLDER DATA — `getFeaturedCars` reads from `lib/data/mockCars.ts`
 * pending the real inventory API (`GET /public/cars?featured=true`).
 *
 * Layout matches the Figma "Light" frame (node 9321:6145): a 2x2 grid of
 * full-bleed photo cards, no separate CTA row below (the per-card arrow
 * button already routes to the car detail page).
 */
export function FeaturedCars() {
  const cars = getFeaturedCars(4);

  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cars.map((car) => (
          <MiniCarCard key={car.id} car={car} imageSrc={car.images[0]?.url} />
        ))}
      </div>
    </div>
  );
}
