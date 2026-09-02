import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { CarCard } from '@/components/shared/CarCard';
import { ChinaFilters } from '@/components/china/ChinaFilters';
import { ChinaFinancing } from '@/components/china/ChinaFinancing';
import { ChinaWhyOrder } from '@/components/china/ChinaWhyOrder';
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
  const priceMin = one(sp.priceMin) ? Number(one(sp.priceMin)) : undefined;
  const priceMax = one(sp.priceMax) ? Number(one(sp.priceMax)) : undefined;

  const [{ items: cars }, facets, banks, { messages }] = await Promise.all([
    listCars({ origin: 'CHINA', condition, make, model, priceMin, priceMax, take: 24 }),
    listMakeModelFacets('CHINA'),
    getBanks(),
    getServerMessages(),
  ]);

  const makeModels = Object.fromEntries(
    Array.from(facets.entries()).map(([m, models]) => [m, Array.from(models)]),
  );

  return (
    <>
      {/* pt-32/pt-40 clears the fixed pill header (Header.tsx, `fixed` +
          `top-9`/`top-2`) — the Homepage gets this for free from its hero's
          own pt-36/pt-44, but this page's first section has no hero to
          borrow that clearance from. */}
      <Section tone="light" className="pb-0 pt-32 sm:pt-40">
        <ChinaFilters makeModels={makeModels} />
      </Section>

      {/* pt override: Figma has this grid sitting just 5px below the filter
          bar above it, not the Section default's full 56/96px top rhythm —
          bottom padding keeps that default since nothing here overrides it. */}
      <Section tone="light" className="pt-[5px] sm:pt-[5px]">
        {cars.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {cars.map((car, index) => (
              <CarCard key={car.id} car={car} priority={index === 0} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-lead text-muted">{messages.china.empty}</p>
        )}
      </Section>

      <Section tone="light">
        <ChinaFinancing banks={banks} />
      </Section>

      <ChinaWhyOrder />

      <Section tone="light">
        <ChinaFaq />
      </Section>

      <ChinaFinalCta />
    </>
  );
}
