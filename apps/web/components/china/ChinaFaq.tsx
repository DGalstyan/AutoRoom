import { Faq } from '@/components/shared/Faq';
import { getFaq } from '@/lib/faq';

/**
 * China S5 — mirrors `HomeFaq`'s pattern, scoped to the CHINA topic. Renders
 * nothing if no CHINA-topic question has a published answer yet — see
 * `lib/faq.ts`'s doc comment: the ten seeded China questions start with
 * `answer: null`, so an empty section here is the real content state, not a
 * bug, until someone answers and publishes them in admin.
 */
export async function ChinaFaq() {
  const items = await getFaq('CHINA');
  if (items.length === 0) return null;

  return <Faq items={items} hideHeading />;
}
