import type { Metadata } from 'next';
import { PartnersBookingProvider } from '@/components/partners/PartnersBookingProvider';
import { PartnersHero } from '@/components/partners/PartnersHero';
import { PartnersWhy } from '@/components/partners/PartnersWhy';
import { PartnersWhoCanJoin } from '@/components/partners/PartnersWhoCanJoin';
import { getBranches } from '@/lib/branches';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return { title: messages.partners.meta.title, description: messages.partners.meta.description };
}

/**
 * `/partners` — "Become a dealer" (`references/pages.md` §5, Figma node
 * 291:53, file 9Lq4XpWusTJj1VnM6laAZr). §S4 "Portal login" isn't in the
 * current Figma mockup at all and is out of scope here — it belongs with
 * the larger `/partners/portal` authed-dashboard buildout tracked
 * separately.
 */
export default async function PartnersPage() {
  const branches = await getBranches();

  return (
    <PartnersBookingProvider branches={branches}>
      <PartnersHero />
      <PartnersWhy />
      <PartnersWhoCanJoin />
    </PartnersBookingProvider>
  );
}
