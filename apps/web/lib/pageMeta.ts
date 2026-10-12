import type { Metadata } from 'next';
import { getLocale } from '@/lib/i18n';

const OG_LOCALE = { hy: 'hy_AM', en: 'en_US', ru: 'ru_RU' } as const;

/**
 * A page's own title and description for the browser tab, search results AND link previews.
 * `openGraph` and `twitter` replace the layout's objects wholesale rather than merging, so a page that
 * only sets `title`/`description` would still share the home page's text when a link is pasted into a
 * messenger. This sets all three together, keeping the shared preview picture.
 */
export async function pageMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}): Promise<Metadata> {
  const locale = await getLocale();
  const image = { url: '/og/default.jpg', width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'AutoRoom',
      locale: OG_LOCALE[locale],
      title,
      description,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}
