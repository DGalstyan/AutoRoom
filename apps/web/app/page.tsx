import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { CarAnatomy } from '@/components/shared/CarAnatomy';
import { FeaturedCars } from '@/components/shared/FeaturedCars';
import { FounderVideo } from '@/components/shared/FounderVideo';
import { CustomerStoryWall } from '@/components/shared/CustomerStoryWall';
import { BranchMap } from '@/components/shared/BranchMap';
import { Faq } from '@/components/shared/Faq';
import { HomeFinalCta } from '@/components/shared/HomeFinalCta';
import { HOMEPAGE_FAQ } from '@/lib/data/faq';
import { messages } from '@/lib/messages';

const hero = messages.home.hero;
const howItWorks = messages.home.howItWorks;
const ecosystem = messages.home.ecosystem;
const branches = messages.home.branches;
const faqSection = messages.home.faqSection;

export default function HomePage() {
  return (
    <>
      {/* S1 — Hero */}
      <Section tone="dark" className="pt-20 sm:pt-28">
        <p className="text-caption font-semibold uppercase tracking-wide text-accent">
          {hero.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-display font-extrabold uppercase tracking-tight text-white">
          {hero.h1}
        </h1>
        <p className="mt-6 max-w-2xl text-lead text-white/70">{hero.sub}</p>

        <div className="mt-12">
          <p className="text-small font-medium uppercase tracking-wide text-white/50">
            {hero.pickerHeading}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-xl">
            <DirectionCard href="/usa" title={hero.usaCard.title} cta={hero.usaCard.cta} />
            <DirectionCard href="/china" title={hero.chinaCard.title} cta={hero.chinaCard.cta} />
          </div>
        </div>
      </Section>

      {/* S2 — Featured Cars */}
      <Section tone="dark">
        <FeaturedCars />
      </Section>

      {/* S3 — Car Anatomy */}
      <Section tone="dark">
        <CarAnatomy />
      </Section>

      {/* S4 — How it works */}
      <Section tone="light">
        <p className="text-caption font-semibold uppercase tracking-wide text-accent">
          {howItWorks.eyebrow}
        </p>
        <h2 className="mt-2 max-w-2xl font-display text-h2 font-bold text-ink">
          {howItWorks.heading}
        </h2>

        <ol className="mt-12 space-y-8 border-l-2 border-line-light pl-8">
          {howItWorks.steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="absolute -left-[2.55rem] flex h-8 w-8 items-center justify-center rounded-pill bg-accent font-display text-small font-bold text-white">
                {index + 1}
              </span>
              <h3 className="font-display text-lead font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 max-w-2xl text-body text-ink/70">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* S5 — Ecosystem */}
      <Section tone="dark">
        <p className="text-caption font-semibold uppercase tracking-wide text-accent">
          {ecosystem.eyebrow}
        </p>
        <h2 className="mt-2 max-w-2xl font-display text-h2 font-bold text-white">
          {ecosystem.heading}
        </h2>
        <ul className="mt-8 flex flex-wrap gap-3">
          {ecosystem.items.map((item) => (
            <li
              key={item}
              className="rounded-pill border border-white/15 px-5 py-3 text-small font-medium text-white/80"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* S6 — Founder video */}
      <Section tone="dark">
        <FounderVideo />
      </Section>

      {/* S7 — Customer Story Wall */}
      <Section tone="dark">
        <CustomerStoryWall />
      </Section>

      {/* S8 — Branches */}
      <Section tone="light">
        <p className="text-caption font-semibold uppercase tracking-wide text-accent">
          {branches.eyebrow}
        </p>
        <h2 className="mt-2 font-display text-h2 font-bold text-ink">{branches.heading}</h2>
        <div className="mt-8">
          <BranchMap />
        </div>
      </Section>

      {/* S9 — FAQ (Homepage aggregated set, verbatim) */}
      <Section tone="light">
        <p className="text-caption font-semibold uppercase tracking-wide text-accent">
          {faqSection.eyebrow}
        </p>
        <div className="mt-4">
          <Faq items={HOMEPAGE_FAQ} />
        </div>
      </Section>

      {/* S10 — Final CTA (Quiz Popup, not Universal) */}
      <HomeFinalCta />
    </>
  );
}

function DirectionCard({ href, title, cta }: { href: string; title: string; cta: string }) {
  return (
    <Button
      href={href}
      variant="secondary"
      className="h-auto min-h-32 flex-col items-start gap-2 rounded-lg px-6 py-6 text-left normal-case"
    >
      <span className="font-display text-h3 font-bold">{title}</span>
      <span className="text-small font-medium text-ink/60">{cta}</span>
    </Button>
  );
}
