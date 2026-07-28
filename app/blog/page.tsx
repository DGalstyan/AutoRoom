import type { Metadata } from 'next';
import { PageHeading } from '@/components/layout/PageHeading';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('blog.title') };

// The header nav links here, but the spec has no blog section yet.
// TODO(client): confirm blog scope + content source.
export default function BlogPage() {
  return <PageHeading title={t('blog.title')} />;
}
