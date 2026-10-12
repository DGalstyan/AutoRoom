import type { Metadata } from 'next';
import { MachineryActions } from '@/components/machinery/MachineryActions';
import { MachineryGlyph } from '@/components/machinery/MachineryGlyph';
import { getServerMessages } from '@/lib/i18n';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return pageMetadata({
    title: messages.machinery.meta.title,
    description: messages.machinery.meta.description,
  });
}

/**
 * `/machinery` — construction machinery imported from China to order (`references/pages.md` §3).
 * There is no machinery catalogue in the admin yet, so this page is a request page: what it is,
 * the three steps, and the offer button (the Universal popup with "Construction machinery"
 * pre-selected). It lists nothing that does not exist.
 */
export default async function MachineryPage() {
  const { messages } = await getServerMessages();
  const t = messages.machinery;

  return (
    <div className="bg-surface-light pb-16 text-ink lg:pb-[150px]">
      <div className="mx-auto flex max-w-page flex-col gap-10 px-4 pt-32 sm:px-6 sm:pt-[185px] lg:gap-16 lg:px-12">
        <header className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <div className="flex flex-col items-start gap-5">
            <span className="rounded-pill bg-white px-4 py-2 text-[14px] font-medium leading-5 text-neutral-800">
              {t.badge}
            </span>
            <h1 className="type-h2 text-ink">{t.heading}</h1>
            <p className="max-w-2xl text-lead text-neutral-700">{t.text}</p>
            <MachineryActions cta={t.cta} contact={t.contact} />
          </div>
          <div className="flex items-center justify-center rounded-[32px] bg-white p-8 text-neutral-800 lg:p-12">
            <MachineryGlyph className="h-auto w-full max-w-[360px]" />
          </div>
        </header>

        <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {t.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-[24px] bg-white p-6 lg:p-8">
              <span className="flex size-11 items-center justify-center rounded-full bg-neutral-25 text-[16px] font-medium text-neutral-800">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-[20px] font-bold leading-7 text-neutral-900">{step.title}</p>
              <p className="text-[16px] leading-6 text-neutral-700">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
