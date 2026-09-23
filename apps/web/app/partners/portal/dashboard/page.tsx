import type { Metadata } from 'next';
import { PortalGate } from '@/components/partners/portal/PortalGate';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.partners.portal.meta.title,
    description: messages.partners.portal.meta.description,
  };
}

/**
 * `/partners/portal/dashboard` — the authed dealer/partner dashboard.
 * `PortalGate` redirects an anonymous visitor back to `/partners/portal`,
 * so this route renders nothing itself for the "not signed in" case.
 */
export default function PartnerPortalDashboardPage() {
  return <PortalGate />;
}
