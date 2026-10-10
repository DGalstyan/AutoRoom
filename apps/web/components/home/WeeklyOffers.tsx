import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedCars } from '@/lib/cars';
import { getServerMessages } from '@/lib/i18n';
import { carHref, formatUsd } from '@/lib/types/car';
import { Reveal } from '@/components/ui/Reveal';

/**
 * "Շաբաթվա լավագույն առաջարկները" — Figma 436:1901. A 2×2 grid of 648×432
 * photo cards (32px radius, black→transparent scrim from the bottom, price pill
 * + 24px name bottom-left, circular arrow bottom-right), 32px between rows.
 *
 * Still real inventory: `getFeaturedCars` reads whatever an admin has marked
 * "Featured on the homepage"; the design shows four, so the first four are
 * shown, and nothing is rendered (no fake cards) when none are featured.
 */
export async function WeeklyOffers() {
  const [cars, { messages }] = await Promise.all([getFeaturedCars(4), getServerMessages()]);
  if (cars.length === 0) return null;
  const t = messages.home.featured;

  return (
    <div className="flex flex-col gap-8 lg:gap-16">
      <h2 className="type-h2 text-ink">{t.heading}</h2>

      <ul className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2 lg:gap-y-8">
        {cars.slice(0, 4).map((car, index) => {
          const image = car.images[0]?.url ?? car.images[0]?.thumbnailUrl;
          return (
            <li key={car.id}>
              <Reveal delayMs={(index % 2) * 120}>
                <Link
                  href={carHref(car)}
                  className="group relative flex h-[300px] w-full flex-col justify-end overflow-hidden rounded-[32px] bg-neutral-800 px-4 pb-3 sm:h-[360px] lg:h-[432px] lg:max-w-[648px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  {image && (
                    <Image
                      src={image}
                      alt={`${car.make} ${car.model}`}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1024px) 648px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[700ms] ease-expo group-hover:scale-[1.04]"
                    />
                  )}
                  <span
                    className="absolute inset-0 bg-gradient-to-t from-black from-[8.565%] to-transparent to-[101.39%]"
                    aria-hidden="true"
                  />
                  <span className="relative flex w-full items-center justify-between">
                    <span className="flex min-w-0 flex-col items-start">
                      <span className="inline-flex items-center rounded-pill p-[10px] text-[16px] font-medium leading-5 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]">
                        {formatUsd(car.price)}
                      </span>
                      <span className="stretch-90 max-w-full truncate text-[24px] font-normal leading-9 text-white">
                        {car.make} {car.model}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex shrink-0 items-center justify-center rounded-pill p-[10px] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] transition-colors duration-standard ease-expo group-hover:bg-accent group-hover:text-ink"
                    >
                      <span className="flex size-[34px] items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M7 17 17 7M17 7H8.5M17 7v8.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>

      <p className="flex justify-center">
        <Link
          href="/offers"
          className="inline-flex h-12 items-center rounded-pill bg-neutral-50 px-6 text-[14px] font-medium text-ink transition-colors duration-standard ease-expo hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t.viewAll}
        </Link>
      </p>
    </div>
  );
}
