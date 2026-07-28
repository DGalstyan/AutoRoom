import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('partners.title') };

// Hero, why/who, portal login entry: P5.1. Meeting-booking popup: P5.2.
export default function PartnersPage() {
  return <PageHeading title={t('partners.title')} />;
}
