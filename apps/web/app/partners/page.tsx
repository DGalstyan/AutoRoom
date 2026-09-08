import type { Metadata } from 'next';
import { ComingSoonHero } from '@/components/shared/ComingSoonHero';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.partners.meta.title,
    description: messages.partners.meta.description,
  };
}

/**
 * `/partners` — interim page. The full B2B build (`references/pages.md`
 * "5. Partners / Dealers"): why-partner/who-can-join sections, the
 * meeting-booking final CTA, and the authed `/partners/portal` dashboard,
 * is its own separate, much larger effort (it needs real auth). Until then
 * this is a real page (not a 404) so the header/footer nav's existing
 * `/partners` link resolves, with the spec's own S1 hero copy and a
 * working lead-capture CTA in place of the eventual meeting-booking popup
 * — see `ComingSoonHero`.
 */
export default async function PartnersPage() {
  const { messages } = await getServerMessages();
  const t = messages.partners;

  return (
    <ComingSoonHero
      h1={t.hero.h1}
      text={t.hero.text}
      ctaLabel={t.hero.cta}
      sourceCta="partners-hero"
      comingSoonHeading={t.comingSoon.heading}
      comingSoonText={t.comingSoon.text}
    />
  );
}
