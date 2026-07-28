import { PageHeading } from '@/components/layout/PageHeading';

// CarDetail variant="usa-available": VIN, mileage, Առկա/Ճանապարհին status,
// same financing blocks as China (P4.3).
export default async function AvailableCarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageHeading title={slug} />;
}
