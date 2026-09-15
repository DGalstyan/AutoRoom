import type { Metadata } from 'next';
import { PartnersBookingProvider } from '@/components/partners/PartnersBookingProvider';
import { PartnersHero } from '@/components/partners/PartnersHero';
import { PartnersWhy } from '@/components/partners/PartnersWhy';
import { PartnersWhoCanJoin } from '@/components/partners/PartnersWhoCanJoin';
import { Footer } from '@/components/shared/Footer';
import { getBranches } from '@/lib/branches';
import { getBrandingLogos } from '@/lib/branding';
import { getContacts } from '@/lib/contacts';
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
  const [branches, logo, contacts] = await Promise.all([
    getBranches(),
    getBrandingLogos(),
    getContacts(),
  ]);

  return (
    <PartnersBookingProvider
      branches={branches}
      footer={<Footer logo={logo} contacts={contacts} />}
    >
      <PartnersHero />
      <PartnersWhy />
      <PartnersWhoCanJoin />
    </PartnersBookingProvider>
  );
}
