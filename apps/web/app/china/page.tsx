import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('china.title') };

// Filters, tabs, financing, FAQ and CTA land in Phase 3 (P3.1).
export default function ChinaPage() {
  return <PageHeading title={t('china.title')} />;
}
