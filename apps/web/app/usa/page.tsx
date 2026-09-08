import type { Metadata } from 'next';
import { ComingSoonHero } from '@/components/shared/ComingSoonHero';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.usa.meta.title,
    description: messages.usa.meta.description,
  };
}

/**
 * `/usa` — interim page. The full build (`references/pages.md` "4. USA"):
 * best-auctions listing, available/on-the-road cars, per-state local-time
 * carousel, and the 12-chapter import scrollytelling, is its own separate,
 * much larger effort. Until then this is a real page (not a 404) so the
 * header/footer nav's existing `/usa` link resolves, with a page-specific
 * hero (copy from the spec's own S1) and a working lead-capture CTA —
 * see `ComingSoonHero`.
 */
export default async function UsaPage() {
  const { messages } = await getServerMessages();
  const t = messages.usa;

  return (
    <ComingSoonHero
      h1={t.hero.h1}
      text={t.hero.text}
      ctaLabel={t.hero.cta}
      sourceCta="usa-hero"
      interest="usa"
      comingSoonHeading={t.comingSoon.heading}
      comingSoonText={t.comingSoon.text}
    />
  );
}
