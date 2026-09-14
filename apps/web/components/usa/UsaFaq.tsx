import { Faq } from '@/components/shared/Faq';
import { getFaq } from '@/lib/faq';
import { getLocale } from '@/lib/i18n';

/**
 * USA S8c — mirrors `ChinaFaq`'s pattern exactly, scoped to the USA topic.
 * Renders nothing until an admin publishes at least one USA-topic question
 * with an answer — see `lib/faq.ts`'s doc comment: an empty section here is
 * the real content state (no USA FAQ published yet), not a bug.
 */
export async function UsaFaq() {
  const items = await getFaq('USA', await getLocale());
  if (items.length === 0) return null;

  return <Faq items={items} hideHeading />;
}
