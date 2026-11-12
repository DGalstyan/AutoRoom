import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/siteOrigin';

/** `/robots.txt` — everything public is open; the partner portal, API and lead-only pages are not for crawlers. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/partners/portal', '/compare'] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
