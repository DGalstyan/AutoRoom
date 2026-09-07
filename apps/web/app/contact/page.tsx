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
 * page) directly in Dev Mode — the OAuth Figma MCP connector is broken in
 * this environment (separate bug report filed), so this used the same
 * Chrome/Dev-Mode inspection approach as the About page pass.
 *
 * S1 Contacts + form → S2 Branches → S3 Quick answers. No hero/header
 * clearance workaround needed — `Section`'s default top padding already
 * clears the fixed header, same as the China listing page.
 */
export default function ContactPage() {
  return (
    <Section tone="light" className="pt-32 sm:pt-40">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-16">
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
