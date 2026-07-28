import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('partners.portalTitle') };

// Authed area — dashboard, my cars, car timeline: P5.3–P5.4.
// TODO(client): auth provider is undecided; P5.3 stubs a mock session.
export default function PartnerPortalPage() {
  return <PageHeading title={t('partners.portalTitle')} />;
}
