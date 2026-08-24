'use client';

import { MiniCarCard } from '@/components/shared/MiniCarCard';
import { useLeadWidgets } from '@/components/shared/LeadWidgetProvider';
import { Button } from '@/components/ui/Button';
import { getFeaturedCars } from '@/lib/data/mockCars';
import { messages } from '@/lib/messages';

const t = messages.home.featured;

/**
 * PLACEHOLDER DATA — `getFeaturedCars` reads from `lib/data/mockCars.ts`
 * pending the real inventory API (`GET /public/cars?featured=true`).
 */
export function FeaturedCars() {
  const { openUniversal } = useLeadWidgets();
  const cars = getFeaturedCars(5);

  return (
    <div>
      <p className="text-caption font-semibold uppercase tracking-wide text-accent">{t.eyebrow}</p>
      <h2 className="mt-2 font-display text-h2 font-bold text-white">{t.heading}</h2>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {cars.map((car) => (
          <MiniCarCard key={car.id} car={car} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          className="border-white/30 text-white"
          onClick={() => openUniversal({ sourceCta: 'home-featured-cars' })}
        >
          {t.cta}
        </Button>
      </div>
    </div>
  );
}
