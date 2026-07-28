import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('about.title') };

// Dark hero, word-burn "Who We Are", team cards + collage, final CTA: P6.1.
export default function AboutPage() {
  return <PageHeading title={t('about.title')} />;
}
