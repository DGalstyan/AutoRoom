import type { Metadata } from 'next';
import { PortalOrderGate } from '@/components/partners/portal/PortalOrderGate';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.partners.portal.meta.title,
    description: messages.partners.portal.meta.description,
  };
}

/**
 * `/partners/portal/orders/[id]` — one order's full picture, opened by
 * clicking a row in the dashboard's orders table. `PortalOrderGate` handles
 * the "not signed in" redirect, same as the dashboard's own `PortalGate`.
 */
export default async function PartnerPortalOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortalOrderGate id={id} />;
}
