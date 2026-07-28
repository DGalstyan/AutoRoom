import { PageHeading } from '@/components/layout/PageHeading';

// CarDetail variant="machinery": tech specs + leasing note, no calculator (P3.3).
export default async function MachineryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageHeading title={slug} />;
}
