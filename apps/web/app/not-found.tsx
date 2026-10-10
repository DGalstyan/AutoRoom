import Link from 'next/link';
import { getServerMessages } from '@/lib/i18n';

/** Localized 404 — without this Next renders its own English "This page could not be found." on every Armenian page. */
export default async function NotFound() {
  const { messages } = await getServerMessages();
  const t = messages.common.notFound;
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 pt-32 text-center">
      <h1 className="font-display text-[32px] font-bold leading-10 text-ink">{t.heading}</h1>
      <p className="text-lead text-neutral-700">{t.body}</p>
      <Link
        href="/"
        className="mt-4 inline-flex h-12 items-center rounded-pill bg-accent px-6 text-[14px] font-medium text-ink transition-colors duration-standard hover:bg-accent-600"
      >
        {t.home}
      </Link>
    </section>
  );
}
