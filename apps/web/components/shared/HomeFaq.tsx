import { Faq } from '@/components/shared/Faq';
import { getHomepageFaq } from '@/lib/faq';

/**
 * Async server component wrapper — mirrors `FeaturedCars`'s pattern of
 * awaiting its own admin-managed data one level below `page.tsx`, rather than
 * making the whole page async. Renders nothing if there's no published
 * GENERAL-topic FAQ content (never a broken/empty accordion shell).
 */
export async function HomeFaq() {
  const items = await getHomepageFaq();
  if (items.length === 0) return null;

  return <Faq items={items} hideHeading />;
}
