import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { TeamSection } from '@/components/shared/TeamSection';
import { getTeamMembers } from '@/lib/team';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.about.meta.title,
    description: messages.about.meta.description,
  };
}

/**
 * About `/about` — currently just the "Մեր թիմը" team grid (Figma node
 * `123:366`, file `9Lq4XpWusTJj1VnM6laAZr`). The rest of Figma's "About us"
 * frame (hero, why-choose stats, founder video, gallery, final CTA) already
 * exists elsewhere on the site in near-identical form (Homepage/China) and
 * is deliberately not duplicated here yet — this page will grow to match
 * the full Figma frame in a later pass.
 */
export default async function AboutPage() {
  const members = await getTeamMembers();

  return (
    // pt-32/pt-40 clears the fixed pill header — this page has no hero to
    // borrow that clearance from, same as the China listing page.
    <Section tone="light" className="pt-32 sm:pt-40">
      <TeamSection members={members} />
    </Section>
  );
}
