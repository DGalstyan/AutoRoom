import { MiniCarCard } from '@/components/shared/MiniCarCard';
import { getFeaturedCars } from '@/lib/cars';
import { getServerMessages } from '@/lib/i18n';

/**
 * Real inventory — `getFeaturedCars` reads `GET /public/cars?featured=true`,
 * i.e. whatever an admin has uploaded and toggled "Featured on the homepage"
 * in the admin panel. Renders nothing (not a placeholder grid) if admin
 * hasn't featured any cars yet, rather than showing fake inventory.
 *
 * Card styling matches the Figma "Light" frame (node 110:392, verified via
 * get_metadata: a 48px column-gap / 32px row-gap, not a uniform gap), but
 * the grid itself shows every admin-featured car rather than capping at
 * the frame's 2x2 sample of 4 — wraps to a 3-up grid on large screens so a
 * full admin-managed catalogue (not just a curated handful) fits without
 * an oddly long single column.
 */
export async function FeaturedCars() {
  const [cars, { messages }] = await Promise.all([getFeaturedCars(24), getServerMessages()]);
  const t = messages.home.featured;
  if (cars.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-home-h2 font-light text-ink">{t.heading}</h2>

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-x-12 lg:grid-cols-3">
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
