import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('usa.title') };

// Auctions, available cars, on-the-road, US times, scrollytelling: Phase 4.
export default function UsaPage() {
  return <PageHeading title={t('usa.title')} />;
}
