import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { ContactInfo } from '@/components/contact/ContactInfo';
import { ContactForm } from '@/components/contact/ContactForm';
import { BranchCards } from '@/components/contact/BranchCards';
import { ContactFaq } from '@/components/contact/ContactFaq';
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
 * S1 Contacts + form → S2 Branches → S3 Quick answers. No hero/header
 * clearance workaround needed — `Section`'s default top padding already
 * clears the fixed header, same as the China listing page.
 *
 * S1's two cards are NOT an even 50/50 split (node `141:583`, verified via
 * get_metadata): the info card is 618px, the form card 683px, with a 43px
 * gap between them, not the `grid-cols-2`/`gap-16` (64px, equal columns)
 * this had — a leftover from when this page was pixel-audited without
 * working Figma MCP access (visual Dev-Mode inspection only).
 */
export default function ContactPage() {
  return (
    <Section tone="light" className="pt-32 sm:pt-40">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-[618fr_683fr] sm:gap-x-[43px]">
        <ContactInfo />
        <ContactForm />
      </div>

      <div className="mt-24">
        <BranchCards />
      </div>

      <div className="mt-24">
        <ContactFaq />
      </div>
    </Section>
  );
}
