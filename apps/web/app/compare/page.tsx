import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { CompareTable } from '@/components/shared/CompareTable';
import { ComparePicker } from '@/components/shared/ComparePicker';
import { CompareCarFinder } from '@/components/shared/CompareCarFinder';
import { getCarBySlug } from '@/lib/cars';
import { CompareBackLink } from '@/components/shared/CompareBackLink';
import { carHref, type Car } from '@/lib/types/car';
import { getFinanceCalculatorSettings } from '@/lib/settings';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return { title: `${messages.common.compare.page.heading} — AutoRoom` };
}

/**
 * `/compare` — the results half of "Compare cars" (Figma node `378:7909`,
 * file `9Lq4XpWusTJj1VnM6laAZr`). Reads the two slugs straight from the URL
 * rather than the client-side `CompareProvider` state: a server-rendered,
 * shareable/bookmarkable `?a=…&b=…` link is simpler than round-tripping
 * through `localStorage` on a page that has no reason to run client-side at
 * all — the picker modal (`CompareModal`) is what actually navigates here.
 */
function toPick(car: Car | null) {
  if (!car) return null;
  return {
    id: car.id,
    slug: car.slug,
    make: car.make,
    model: car.model,
    year: car.year,
    imageUrl: car.images[0]?.thumbnailUrl ?? car.images[0]?.url,
    origin: car.origin,
    condition: car.condition,
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const slugA = typeof sp.a === 'string' ? sp.a : undefined;
  const slugB = typeof sp.b === 'string' ? sp.b : undefined;

  const [carA, carB, finance, { messages }] = await Promise.all([
    slugA ? getCarBySlug(slugA) : Promise.resolve(null),
    slugB ? getCarBySlug(slugB) : Promise.resolve(null),
    getFinanceCalculatorSettings(),
    getServerMessages(),
  ]);
  const t = messages.common.compare.page;

  return (
    <Section tone="light" wide className="pt-32 sm:pb-[150px] sm:pt-[185px]">
      <Reveal>
        <div className="mb-16 flex items-center gap-3">
          {/* 48px "‹" before the heading, back to the car the comparison started from. */}
          <CompareBackLink
            href={carA ? carHref(carA) : carB ? carHref(carB) : '/china'}
            label={t.back}
            className="flex size-12 shrink-0 items-center justify-center rounded-pill text-ink transition-colors duration-standard hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path
                d="m29 14-10 10 10 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </CompareBackLink>
          <h1 className="type-h2 text-ink">{t.heading}</h1>
        </div>
      </Reveal>

      {carA && carB ? (
        <CompareTable carA={carA} carB={carB} finance={finance} />
      ) : (
        <ComparePicker initialA={toPick(carA)} initialB={toPick(carB)} />
      )}

      {/* "Neither of these is it" escape hatch, right on the results page —
          Figma node 393:530 shows this same 5-question finder below the
          compare content in both its mock states. */}
      <div className="mt-16 sm:mt-[150px]">
        <CompareCarFinder />
      </div>
    </Section>
  );
}
