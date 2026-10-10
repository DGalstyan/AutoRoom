import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { CompareTable } from '@/components/shared/CompareTable';
import { CompareCarFinder } from '@/components/shared/CompareCarFinder';
import { getCarBySlug } from '@/lib/cars';
import { getFinanceCalculatorSettings } from '@/lib/settings';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return { title: messages.common.compare.page.heading };
}

/**
 * `/compare` — the results half of "Compare cars" (Figma node `378:7909`,
 * file `9Lq4XpWusTJj1VnM6laAZr`). Reads the two slugs straight from the URL
 * rather than the client-side `CompareProvider` state: a server-rendered,
 * shareable/bookmarkable `?a=…&b=…` link is simpler than round-tripping
 * through `localStorage` on a page that has no reason to run client-side at
 * all — the picker modal (`CompareModal`) is what actually navigates here.
 */
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
        <h1 className="type-h2 mb-16 text-ink">{t.heading}</h1>
      </Reveal>

      {carA && carB ? (
        <CompareTable carA={carA} carB={carB} finance={finance} />
      ) : (
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <p className="text-body text-neutral-700">{t.empty}</p>
          <Link
            href="/china"
            className="inline-flex h-12 items-center rounded-pill bg-accent px-6 text-[14px] font-bold text-ink transition-colors duration-standard hover:bg-accent-600"
          >
            {t.browseCta}
          </Link>
        </div>
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
