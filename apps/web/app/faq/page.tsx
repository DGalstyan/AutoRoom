import type { Metadata } from 'next';
import Link from 'next/link';
import { Faq } from '@/components/shared/Faq';
import { getFaq, type FaqTopic } from '@/lib/faq';
import { getServerMessages } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const TOPICS: { id: string; topic: FaqTopic; key: 'general' | 'china' | 'usa' }[] = [
  { id: 'general', topic: 'GENERAL', key: 'general' },
  { id: 'china', topic: 'CHINA', key: 'china' },
  { id: 'usa', topic: 'USA', key: 'usa' },
];

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return { title: messages.faqPage.meta.title, description: messages.faqPage.meta.description };
}

/**
 * `/faq` — every published question from the admin, grouped by topic (General / China / USA).
 * The «Տես բոլոր հարցերը» link under each FAQ block on the site lands here, on that topic's
 * anchor. Topics with nothing published are left out; with nothing at all the page says so.
 * Also emits `FAQPage` structured data.
 */
export default async function FaqPage() {
  const { messages, locale } = await getServerMessages();
  const t = messages.faqPage;

  const groups = (
    await Promise.all(
      TOPICS.map(async (entry) => ({ ...entry, items: await getFaq(entry.topic, locale) })),
    )
  ).filter((group) => group.items.length > 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groups.flatMap((group) =>
      group.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    ),
  };

  return (
    <div className="bg-surface-light pb-16 text-ink lg:pb-[150px]">
      <div className="mx-auto flex max-w-page flex-col gap-10 px-4 pt-32 sm:px-6 sm:pt-[185px] lg:gap-16 lg:px-12">
        <header className="flex flex-col gap-4">
          <h1 className="stretch-88 text-[32px] font-light leading-10 sm:text-home-h2 sm:leading-[58px]">
            {t.heading}
          </h1>
          <p className="max-w-2xl text-lead text-neutral-700">{t.intro}</p>
          {groups.length > 1 && (
            <nav aria-label={t.heading} className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <a
                  key={group.id}
                  href={`#${group.id}`}
                  className="inline-flex min-h-11 items-center rounded-pill bg-white px-5 text-[16px] text-neutral-800 transition-colors duration-standard hover:bg-neutral-50"
                >
                  {t.topics[group.key]}
                </a>
              ))}
            </nav>
          )}
        </header>

        {groups.length === 0 ? (
          <p className="py-8 text-center text-lead text-neutral-700">{t.empty}</p>
        ) : (
          groups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-32">
              <Faq items={group.items} heading={t.topics[group.key]} />
            </section>
          ))
        )}

        <div className="flex justify-center">
          <Link
            href="/contact"
            className="inline-flex h-12 items-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard ease-expo hover:bg-accent-600"
          >
            {t.contactCta}
          </Link>
        </div>
      </div>

      {groups.length > 0 && (
        <script
          type="application/ld+json"
          // Built from admin text on the server and serialized as JSON; `<` is escaped so an answer
          // can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </div>
  );
}
