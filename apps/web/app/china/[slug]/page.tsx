import { PageHeading } from '@/components/layout/PageHeading';

// CarDetail variant="china" lands in Phase 3 (P3.2): color picker, PriceJourney,
// BuyWithLoan + LoanCalculator, two sticky CTAs.
export default async function ChinaCarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageHeading title={slug} />;
}
