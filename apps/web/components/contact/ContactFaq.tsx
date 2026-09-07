import { Faq } from '@/components/shared/Faq';
import { getFaq } from '@/lib/faq';
import { getLocale } from '@/lib/i18n';

const TOP_COUNT = 4;

/**
 * Contact `/contact` S3 "Quick answers" (`references/pages.md` "8. Contact"
 * S3: "3-4 top FAQ (accordion) + link `Տես բոլոր հարցերը` → FAQ"). Figma
 * node `141:1023`'s `Div [Faq_container__VPEbM]` (file `9Lq4XpWusTJj1VnM6laAZr`
 * — the raw HTML class name in that node's name is a tell this frame was
 * synced from a real rendered page, not hand-drawn) shows 6 questions, and
 * the first one read verbatim off the Figma canvas ("Որքա՞ն ժամանակում
 * կժամանի մեքենան, եթե պատվիրեմ Չինաստանից։") matches the *first* entry of
 * `references/faq.md`'s "Homepage aggregated set" exactly — the same
 * GENERAL-topic set `HomeFaq` already renders. So this reuses that same
 * admin-managed `getFaq('GENERAL')` data instead of hand-copying Figma's 6
 * questions into a second, divergeable copy.
 *
 * Originally linked "Տես բոլոր հարցերը" out to `/#faq` — but that's a link
 * to a *different page* showing the *exact same data* this component
 * already has in hand, which reads as broken/pointless rather than helpful.
 * Now shows the spec's "3-4 top" (`TOP_COUNT`) with a same-page "Load more"
 * (via `Faq`'s `initialCount`) that reveals the rest in place instead.
 */
export async function ContactFaq() {
  const items = await getFaq('GENERAL', await getLocale());
  if (items.length === 0) return null;

  return <Faq items={items} initialCount={TOP_COUNT} />;
}
