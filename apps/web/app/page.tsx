import Image from 'next/image';
import { Section } from '@/components/ui/Section';
import { CarAnatomy } from '@/components/shared/CarAnatomy';
import { FeaturedCars } from '@/components/shared/FeaturedCars';
import { FounderVideo } from '@/components/shared/FounderVideo';
import { CustomerStoryWall } from '@/components/shared/CustomerStoryWall';
import { BranchMap } from '@/components/shared/BranchMap';
import { Faq } from '@/components/shared/Faq';
import { HomeFinalCta } from '@/components/shared/HomeFinalCta';
import { DirectionCard } from '@/components/shared/DirectionCard';
import { HowItWorksStep } from '@/components/shared/HowItWorksStep';
import { HOMEPAGE_FAQ } from '@/lib/data/faq';
import { messages } from '@/lib/messages';

const hero = messages.home.hero;
const howItWorks = messages.home.howItWorks;
const ecosystem = messages.home.ecosystem;
const branches = messages.home.branches;

// How-it-works photo row — matches Figma's 7-card strip (one wide "hero" card
// with the full step-1 copy, six narrow numbered strips after it).
const STEP_PHOTOS = [
  '/images/home/step-1.jpg',
  '/images/home/step-2.jpg',
  '/images/home/step-3.jpg',
  '/images/home/step-4.jpg',
  '/images/home/step-5.jpg',
  '/images/home/step-6.jpg',
  '/images/home/step-7.jpg',
];

export default function HomePage() {
  return (
    <>
      {/* S1 — Hero. Full-bleed desert photo (LCP image), dark scrim for the
          headline, then a fade down to the page's light background so the
          stat strip + direction picker read as an extension of the page
          rather than a hard section cut (matches Figma's blurred tan→white
          gradient band behind the stats, node 9321:6345). */}
      <section className="relative isolate overflow-hidden bg-bg pb-24 pt-36 sm:pb-32 sm:pt-44">
        <Image
          src="/images/home/hero-desert.jpg"
          alt="AutoRoom-ով ներմուծված մեքենան անապատում"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-surface-light"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-container px-4 sm:px-6">
          <h1 className="mx-auto max-w-3xl text-center font-display text-home-hero font-bold text-neutral-50">
            {hero.h1}
          </h1>

          <div className="relative mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 text-center sm:mt-24 sm:grid-cols-3 sm:gap-6">
            {hero.stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-home-stat font-bold text-ink">{stat.value}</p>
                <p className="mt-1 font-display text-home-label font-bold text-ink/90">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Direction picker — plain light page background, immediately below
          the hero's fade (node 9321:6263). */}
      <Section tone="light" className="pt-0 sm:pt-0">
        <h2 className="text-center font-display text-home-h2 font-light text-ink">
          {hero.pickerHeading}
        </h2>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <DirectionCard
            href="/usa"
            title={hero.usaCard.title}
            image="/images/home/direction-usa.webp"
            imageAlt={hero.usaCard.cta}
          />
          <DirectionCard
            href="/china"
            title={hero.chinaCard.title}
            image="/images/home/direction-china.webp"
            imageAlt={hero.chinaCard.cta}
          />
        </div>
      </Section>

      {/* S2 — Featured Cars */}
      <Section tone="light">
        <FeaturedCars />
      </Section>

      {/* S3 — "Ինչո՞ւ ընտրել AutoRoom-ը" (Car Anatomy) */}
      <Section tone="light">
        <CarAnatomy />
      </Section>

      {/* S4 — How it works: a photo strip, one wide card carrying the full
          step-1 copy, six narrow numbered strips after it (node 9321:6346). */}
      <Section tone="light">
        <h2 className="font-display text-home-h2 font-light text-ink">{howItWorks.heading}</h2>
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2 sm:gap-3 lg:overflow-visible">
          {howItWorks.steps.map((step, index) => (
            <HowItWorksStep
              key={step.title}
              index={index}
              title={step.title}
              text={step.text}
              image={STEP_PHOTOS[index]}
              wide={index === 0}
            />
          ))}
        </div>
      </Section>

      {/* S5 — AutoRoom Ecosystem: photo + overlapping glass list (node
          9321:6269 / 9321:6642). No visible heading in Figma — kept as an
          sr-only heading for the a11y outline. */}
      <Section tone="light">
        <h2 className="sr-only">{ecosystem.heading}</h2>
        <div className="relative overflow-hidden rounded-xl">
          <div className="relative aspect-[16/9] w-full sm:aspect-[980/551]">
            <Image
              src="/images/home/ecosystem-strip.jpg"
              alt="AutoRoom-ի մեքենան ճանապարհին"
              fill
              sizes="(min-width: 1024px) 980px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-4 sm:absolute sm:right-6 sm:top-1/2 sm:w-[360px] sm:-translate-y-1/2 sm:p-0">
            <ul className="rounded-xl bg-white/90 p-6 shadow-card backdrop-blur sm:bg-white/85">
              {ecosystem.items.map((item) => (
                <li
                  key={item}
                  className="border-b border-line-light py-3 text-home-label font-normal text-ink last:border-b-0"
                >
                  {item.trim()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* S6 — Founder storytelling video (node 9321:6212) */}
      <Section tone="light">
        <FounderVideo />
      </Section>

      {/* S7 — Customer Story Wall (node 9321:6185) */}
      <Section tone="light">
        <CustomerStoryWall />
      </Section>

      {/* S8 — "Միշտ քո կողքին" branches, dark world-map band (node 9332:7854) */}
      <Section tone="dark" className="bg-bg">
        <h2 className="text-center font-display text-home-h2 font-light text-white">
          {branches.heading}
        </h2>
        <div className="mt-10">
          <BranchMap />
        </div>
      </Section>

      {/* S9 — FAQ (Homepage aggregated set, verbatim) */}
      <Section tone="light">
        <Faq items={HOMEPAGE_FAQ} hideHeading />
      </Section>

      {/* S10 — Final CTA (Quiz Popup, not Universal) */}
      <HomeFinalCta />
    </>
  );
}
