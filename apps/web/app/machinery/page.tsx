import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('machinery.title') };

// Machinery list (all cards `պատվերով`) lands in Phase 3 (P3.3).
export default function MachineryPage() {
  return <PageHeading title={t('machinery.title')} />;
}
