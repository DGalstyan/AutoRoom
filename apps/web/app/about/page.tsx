import type { Metadata } from 'next';
import { TeamSection } from '@/components/shared/TeamSection';
import { FounderVideo } from '@/components/shared/FounderVideo';
import { AboutHero } from '@/components/about/AboutHero';
import { MissionStatement } from '@/components/about/MissionStatement';
import { WhyAutoRoom } from '@/components/home/WhyAutoRoom';
import { PhotoGallery } from '@/components/about/PhotoGallery';
import { AboutFinalCta } from '@/components/about/AboutFinalCta';
import { getTeamMembers } from '@/lib/team';
import { getGalleryImages } from '@/lib/gallery';
import { getFounderVideo } from '@/lib/media';
import { getServerMessages } from '@/lib/i18n';

/** The 1440 design's column: 1344px, 48px gutters (16 / 24 on phones and tablets). */
const COLUMN = 'mx-auto max-w-page px-4 sm:px-6 lg:px-12';

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
 * photo gallery → S5 Final CTA. (Figma's S5b, a block repeating the hero's own intro and both
 * CTAs verbatim, is deliberately left out: the same copy twice on one page.) S6 "Stay in touch" (socials) isn't a separate
 * on-page block — it's the sitewide `Footer`, already rendered by the root
 * layout on every page, socials included.
 */
export default async function AboutPage() {
  const [members, { messages }, founderVideo, galleryImages] = await Promise.all([
    getTeamMembers(),
    getServerMessages(),
    getFounderVideo(),
    getGalleryImages(),
  ]);

  const why = messages.home.anatomy;

  return (
    <>
      {/* Spacing follows Figma "About us" 436:2177: hero → black band 150 → why 150 →
          team 150 → video 43 → gallery 100 → closing band 150 → intro 80 → footer. */}
      <AboutHero />
      <MissionStatement />

      <section className={`${COLUMN} mt-16 lg:mt-[150px]`}>
        <WhyAutoRoom
          heading={messages.about.whyChooseUs.heading}
          hotspots={why.imageHotspots}
          stats={messages.about.whyChooseUs.stats}
          markers="baked"
        />
      </section>

      <section className={`${COLUMN} mt-16 lg:mt-[150px]`}>
        <TeamSection members={members} />
      </section>

      <section className={`${COLUMN} mt-16 lg:mt-[43px]`}>
        <FounderVideo heading={messages.about.founder.heading} video={founderVideo} />
      </section>

      {galleryImages.length > 0 && (
        <section className={`${COLUMN} mt-16 lg:mt-[100px]`}>
          <PhotoGallery images={galleryImages} />
        </section>
      )}

      <div className="mt-16 lg:mt-[150px]">
        <AboutFinalCta />
      </div>
    </>
  );
}
