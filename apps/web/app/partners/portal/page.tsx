import type { Metadata } from 'next';
import { PortalLoginForm } from '@/components/partners/portal/PortalLoginForm';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.partners.portal.meta.title,
    description: messages.partners.portal.meta.description,
  };
}

/**
 * `/partners/portal` — dealer/partner sign-in. `references/pages.md` §5 S4
 * ("Portal login") links here; the dashboard itself lives at
 * `/partners/portal/dashboard` once signed in (see that route's own file).
 */
export default function PartnerPortalLoginPage() {
  return <PortalLoginForm />;
}
