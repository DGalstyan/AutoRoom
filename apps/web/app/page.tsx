import { HomeHero } from '@/components/home/HomeHero';
import { CountryCard } from '@/components/home/CountryCard';
import { StartCtaBand } from '@/components/home/StartCtaBand';
import { WeeklyOffers } from '@/components/home/WeeklyOffers';
import { WhyAutoRoom } from '@/components/home/WhyAutoRoom';
import { JourneyStrip } from '@/components/home/JourneyStrip';
import { EcosystemShowcase } from '@/components/home/EcosystemShowcase';
import { NearYouMap } from '@/components/home/NearYouMap';
import { FounderVideo } from '@/components/shared/FounderVideo';
import { CustomerStoryWall } from '@/components/shared/CustomerStoryWall';
import { HomeFaq } from '@/components/shared/HomeFaq';
import { HomeFinalCta } from '@/components/shared/HomeFinalCta';
import { Reveal } from '@/components/ui/Reveal';
import { getServerMessages } from '@/lib/i18n';
import { getFounderVideo, listCustomerStories } from '@/lib/media';

/** Page column of the 1440 design: 1344px with 48px gutters (16 / 24 on phones and tablets). */
const COLUMN = 'mx-auto max-w-page px-4 sm:px-6 lg:px-12';
/** Vertical rhythm between sections: 150px on desktop (Figma), 64px on phones. */
const GAP = 'mt-16 lg:mt-[150px]';

export default async function HomePage() {
  const [{ messages }, founderVideo, customerStories] = await Promise.all([
    getServerMessages(),
    getFounderVideo(),
    listCustomerStories(),
  ]);
  const { hero, anatomy, howItWorks, ecosystem, branches } = messages.home;

  return (
    <>
      {/* Hero → direction picker → black "start" band → weekly offers → why
          AutoRoom → journey → ecosystem → founder video → stories → map → FAQ →
          closing band; spacing and geometry from Figma "Homepage" 436:1891. */}
      <HomeHero h1={hero.h1} stats={hero.stats} />

      <section className={`${COLUMN} mt-12 lg:mt-16`}>
        <h2 className="type-h2 text-center text-ink">{hero.pickerHeading}</h2>
        <div className="mt-8 flex flex-col items-center gap-6 lg:mt-16 lg:flex-row lg:justify-center lg:gap-10 min-[1400px]:gap-[126px]">
          <Reveal className="w-full lg:flex-1 lg:max-w-[597px] min-[1400px]:flex-none">
            <CountryCard
              href="/usa"
              title={hero.usaCard.title}
              image="/images/home/v2/direction-usa.webp"
              imageAlt={hero.usaCard.cta}
              size="usa"
            />
          </Reveal>
          <Reveal
            delayMs={150}
            className="w-full lg:flex-1 lg:max-w-[597px] min-[1400px]:flex-none"
          >
            <CountryCard
              href="/china"
              title={hero.chinaCard.title}
              image="/images/home/v2/direction-china.webp"
              imageAlt={hero.chinaCard.cta}
              size="china"
            />
          </Reveal>
        </div>
      </section>

      <div className="mt-16 lg:mt-[160px]">
        <StartCtaBand />
      </div>

      <section className={`${COLUMN} ${GAP}`}>
        <WeeklyOffers />
      </section>

      <section className={`${COLUMN} ${GAP}`}>
        <WhyAutoRoom
          heading={anatomy.heading}
          hotspots={anatomy.imageHotspots}
          stats={anatomy.stats}
        />
      </section>

      <section className={`${COLUMN} ${GAP}`}>
        <JourneyStrip heading={howItWorks.heading} steps={howItWorks.steps} />
      </section>

      <section className={`${COLUMN} ${GAP}`}>
        <EcosystemShowcase heading={ecosystem.heading} items={ecosystem.items} />
      </section>

      <section className={`${COLUMN} ${GAP}`}>
        <FounderVideo video={founderVideo} />
      </section>

      {/* Renders nothing until an admin publishes at least one story. */}
      {customerStories.length > 0 && (
        <section className={`${COLUMN} ${GAP}`}>
          <CustomerStoryWall stories={customerStories} />
        </section>
      )}

      <div className={GAP}>
        <NearYouMap heading={branches.heading} cta={branches.cta} href="/contact#branches" />
      </div>

      <section id="faq" className={`${COLUMN} mt-4 lg:mt-[17px]`}>
        <HomeFaq />
      </section>

      <div className={GAP}>
        <HomeFinalCta />
      </div>
    </>
  );
}
