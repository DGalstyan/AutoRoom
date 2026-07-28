import { PageHeading } from '@/components/layout/PageHeading';

// CarDetail variant="usa-auction": VIN/Lot, damage history, View-Only explainer,
// customs calculator, platform-dependent CTAs (P4.2).
export default async function AuctionCarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageHeading title={slug} />;
}
