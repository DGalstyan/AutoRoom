import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { TeamSection } from '@/components/shared/TeamSection';
import { FounderVideo } from '@/components/shared/FounderVideo';
import { AboutHero } from '@/components/about/AboutHero';
import { MissionStatement } from '@/components/about/MissionStatement';
import { WhyChooseUs } from '@/components/about/WhyChooseUs';
import { PhotoGallery } from '@/components/about/PhotoGallery';
import { AboutFinalCta } from '@/components/about/AboutFinalCta';
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
 * About `/about` — the full Figma "About us" frame (`123:295`, file
 * `9Lq4XpWusTJj1VnM6laAZr`), pixel-audited section by section directly in
 * Figma's Dev Mode inspector (see report for exact node IDs/values):
 * S1 Hero → S2 Who We Are → S3 Why choose us → S4 Team + founder video +
 * photo gallery → S5 Final CTA. S6 "Stay in touch" (socials) isn't a
 * separate on-page block — it's the sitewide `Footer`, already rendered by
 * the root layout on every page, socials included.
 */
export default async function AboutPage() {
  const [members, { messages }] = await Promise.all([getTeamMembers(), getServerMessages()]);

  return (
    <>
      <AboutHero />
      <MissionStatement />
      <Section tone="light">
        <WhyChooseUs />
      </Section>
      <Section tone="light">
        <TeamSection members={members} />
        <div className="mt-24">
          <FounderVideo heading={messages.about.founder.heading} />
        </div>
      </Section>
      <Section tone="light" className="pt-0 sm:pt-0">
        <PhotoGallery />
      </Section>
      <AboutFinalCta />
    </>
  );
}
