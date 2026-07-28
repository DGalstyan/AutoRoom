import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('contact.title') };

// Contacts + static form + BranchMap + quick FAQ: P6.3.
export default function ContactPage() {
  return <PageHeading title={t('contact.title')} />;
}
