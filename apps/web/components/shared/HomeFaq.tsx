import { Faq } from '@/components/shared/Faq';
import { getHomepageFaq } from '@/lib/faq';
import { getLocale } from '@/lib/i18n';

/**
 * Async server component wrapper — mirrors `FeaturedCars`'s pattern of
 * awaiting its own admin-managed data one level below `page.tsx`, rather than
 * making the whole page async. Renders nothing if there's no published
 * GENERAL-topic FAQ content (never a broken/empty accordion shell).
 */
export async function HomeFaq() {
  const locale = await getLocale();
  const items = await getHomepageFaq(locale);
  if (items.length === 0) return null;

  return <Faq items={items} hideHeading />;
}
