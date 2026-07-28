import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

// Sections S1–S11 land in Phase 2 (P2.1–P2.4).
export default function HomePage() {
  return <PageHeading title={t('home.title')} subtitle={t('home.subtitle')} />;
}
