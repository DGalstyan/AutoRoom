import type { Metadata } from 'next';
import { ContactInfo } from '@/components/contact/ContactInfo';
import { ContactForm } from '@/components/contact/ContactForm';
import { BranchCards } from '@/components/contact/BranchCards';
import { ContactFaq } from '@/components/contact/ContactFaq';
import { ContactFinalCta } from '@/components/contact/ContactFinalCta';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.contact.meta.title,
    description: messages.contact.meta.description,
  };
}

/**
 * Contact `/contact` (`references/pages.md` "8. Contact"), pixel-audited
 * against Figma node `141:422` (file `9Lq4XpWusTJj1VnM6laAZr`, "cnnect us"
 * page).
 *
 * S1 Contacts + form → S2 Branches → S3 Quick answers → S4 Final CTA. No
 * hero/header clearance workaround needed — `Section`'s default top
 * padding already clears the fixed header, same as the China listing page.
 * S4 (`ContactFinalCta`, node `141:803`) was missing from this page
 * entirely until this pass — it has its own full-bleed dark background, so
 * it sits outside the light `<Section>` wrapper as its own sibling, same
 * as every other page's final CTA.
 *
 * S1's two cards are NOT an even 50/50 split (node `141:583`, verified via
 * get_metadata): the info card is 618px, the form card 683px, with a 43px
 * gap between them, not the `grid-cols-2`/`gap-16` (64px, equal columns)
 * this had — a leftover from when this page was pixel-audited without
 * working Figma MCP access (visual Dev-Mode inspection only).
 */
/** The 1440 design's column: 1344px, 48px gutters (16 / 24 on phones and tablets). */
const COLUMN = 'mx-auto max-w-page px-4 sm:px-6 lg:px-12';

export default function ContactPage() {
  // Spacing from Figma "Contact us" 436:2389: the contact + form cards start 185px down
  // (below the floating header); 150px between every following block.
  return (
    <>
      <section className={`${COLUMN} pt-32 lg:pt-[185px]`}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[618fr_683fr] sm:gap-x-[43px]">
          <ContactInfo />
          <ContactForm />
        </div>
      </section>

      <section id="branches" className={`${COLUMN} mt-16 scroll-mt-32 lg:mt-[150px]`}>
        <BranchCards />
      </section>

      <section className={`${COLUMN} mt-16 lg:mt-[150px]`}>
        <ContactFaq />
      </section>

      <div className="mt-16 lg:mt-[150px]">
        <ContactFinalCta />
      </div>
    </>
  );
}
