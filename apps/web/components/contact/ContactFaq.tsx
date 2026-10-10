import { Faq } from '@/components/shared/Faq';
import { getFaq } from '@/lib/faq';
import { getLocale } from '@/lib/i18n';

/**
 * Contact `/contact` "Quick answers" — Figma 436:2627: the 760px accordion with
 * no heading, every question listed (the first one open). It reuses the same
 * admin-managed `getFaq('GENERAL')` data the homepage FAQ shows rather than a
 * second hand-copied list; renders nothing when there is none.
 */
export async function ContactFaq() {
  const items = await getFaq('GENERAL', await getLocale());
  if (items.length === 0) return null;

  return <Faq items={items} hideHeading viewAllHref="/faq#general" />;
}
