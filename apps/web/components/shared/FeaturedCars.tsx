import { MiniCarCard } from '@/components/shared/MiniCarCard';
import { getFeaturedCars } from '@/lib/cars';
import { messages } from '@/lib/messages';

const t = messages.home.featured;

/**
 * Real inventory — `getFeaturedCars` reads `GET /public/cars?featured=true`,
 * i.e. whatever an admin has uploaded and toggled "Featured on the homepage"
 * in the admin panel. Renders nothing (not a placeholder grid) if admin
 * hasn't featured any cars yet, rather than showing fake inventory.
 *
 * Layout matches the Figma "Light" frame (node 9321:6145): a 2x2 grid of
 * full-bleed photo cards, no separate CTA row below (the per-card arrow
 * button already routes to the car detail page).
 */
export async function FeaturedCars() {
  const cars = await getFeaturedCars(4);
  if (cars.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cars.map((car, index) => (
          <MiniCarCard
            key={car.id}
            car={car}
            imageSrc={car.images[0]?.url}
            priority={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
