import type { Metadata } from 'next';
import { CarCard } from '@/components/shared/CarCard';
import { ChinaFilters } from '@/components/china/ChinaFilters';
import { ChinaFinancing } from '@/components/china/ChinaFinancing';
import { ChinaWhyOrder } from '@/components/china/ChinaWhyOrder';
import { ChinaServices } from '@/components/china/ChinaServices';
import { ChinaFaq } from '@/components/china/ChinaFaq';
import { ChinaFinalCta } from '@/components/china/ChinaFinalCta';
import { listCars, listMakeModelFacets } from '@/lib/cars';
import { getBanks } from '@/lib/banks';
import { getServerMessages } from '@/lib/i18n';
import type { CarCondition } from '@/lib/types/car';

export const metadata: Metadata = {
  title: 'Ավտոմեքենաներ Չինաստանից — AutoRoom',
  description:
    'Ընտրիր և պատվիրիր մեքենա Չինաստանից AutoRoom-ի միջոցով՝ թափանցիկ գնագոյացմամբ, ֆինանսավորմամբ և ամբողջական ուղեկցումով մինչև հանձնում։',
};

/** The design's 1344px column inside 48px gutters (Figma 1440 canvas). */
const COLUMN = 'mx-auto max-w-page px-4 sm:px-6 lg:px-12';

const CONDITIONS: readonly CarCondition[] = ['IN_STOCK', 'ON_ORDER', 'ON_ROAD', 'AUCTION'];

function toCondition(value: string | undefined): CarCondition | undefined {
  return CONDITIONS.find((c) => c === value);
}

/**
 * China `/china` — the listing page behind the "Չինաստան" homepage card.
 * Filters live in `searchParams`, so every filter change is a normal
 * navigation and the grid is fetched server-side on every request (never a
 * client-side call to the API) — see `ChinaFilters`'s doc comment.
 *
 * Section order and copy pixel-matched to Figma node 101:131
 * (file 9Lq4XpWusTJj1VnM6laAZr), cross-checked against
 * `references/pages.md`'s China `/china` spec.
 */
export default async function ChinaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

  const condition = toCondition(one(sp.condition));
  const make = one(sp.make);
  const model = one(sp.model);
  const search = one(sp.q)?.trim().slice(0, 120) || undefined;
  const priceMin = one(sp.priceMin) ? Number(one(sp.priceMin)) : undefined;
  const priceMax = one(sp.priceMax) ? Number(one(sp.priceMax)) : undefined;

  const [{ items: cars, total }, facets, banks, { messages }] = await Promise.all([
    listCars({ origin: 'CHINA', condition, make, model, search, priceMin, priceMax, take: 24 }),
    listMakeModelFacets('CHINA'),
    getBanks(),
    getServerMessages(),
  ]);

  const makeModels = Object.fromEntries(
    Array.from(facets.entries()).map(([m, models]) => [m, Array.from(models)]),
  );

  return (
    <>
      {/* The design has no visible page title here; keep one h1 for the document outline. */}
      <h1 className="sr-only">{messages.common.nav.china}</h1>
      {/* pt-32 (156px from `sm`, per Figma) clears the fixed pill header — the
          Homepage gets this from its hero's own padding, this page has no hero. */}
      <section className={`${COLUMN} bg-surface-light pt-32 text-ink sm:pt-[156px]`}>
        <ChinaFilters makeModels={makeModels} total={total} />
      </section>

      <section className={`${COLUMN} bg-surface-light text-ink`}>
        {cars.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
            {cars.map((car, index) => (
              <CarCard key={car.id} car={car} priority={index === 0} badgesEnd />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-lead text-muted">{messages.china.empty}</p>
        )}
      </section>

      <section className={`${COLUMN} bg-surface-light pt-16 text-ink lg:pt-[150px]`}>
        <ChinaFinancing banks={banks} />
      </section>

      <div className="bg-surface-light pt-16 lg:pt-[150px]">
        <ChinaServices />
      </div>

      <ChinaWhyOrder />

      <section className="bg-surface-light py-14 text-ink lg:pb-[134px] lg:pt-[83px]">
        <div className="mx-auto max-w-container px-4 sm:px-6">
          <ChinaFaq />
        </div>
      </section>

      <ChinaFinalCta />
    </>
  );
}
