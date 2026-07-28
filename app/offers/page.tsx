import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('offers.title') };

// FeaturedCars + Ակցիաներ tabs (Ընթացիկ | Անցած) + promo detail: P6.2.
export default function OffersPage() {
  return <PageHeading title={t('offers.title')} />;
}
