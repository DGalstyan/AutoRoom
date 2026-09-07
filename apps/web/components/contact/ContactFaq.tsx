import Link from 'next/link';
import { Faq } from '@/components/shared/Faq';
import { getFaq } from '@/lib/faq';
import { getServerMessages } from '@/lib/i18n';

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
 * "Տես բոլոր հարցերը" points at `/#faq` — Homepage's own FAQ section, now
 * given an `id="faq"` anchor for exactly this link.
 */
export async function ContactFaq() {
  const [items, { messages }] = await Promise.all([getFaq('GENERAL'), getServerMessages()]);
  if (items.length === 0) return null;

  return (
    <div>
      <Faq items={items} />
      <p className="mt-6 text-center">
        <Link href="/#faq" className="text-body font-medium text-accent hover:text-accent-600">
          {messages.contact.faq.seeAll}
        </Link>
      </p>
    </div>
  );
}
