/**
 * Server-only fetch of published blog articles (`apps/api`'s `GET /public/blog`).
 * Same contract as `lib/faq.ts`: `no-store` so an unpublish in admin shows on the
 * next load, never throws (an unreachable API resolves to "no articles"), and
 * each text field falls back to Armenian when the visitor's language has none.
 */

import type { Locale } from '@/lib/i18n';
import { apiBase } from '@/lib/env';

type Localized = { hy?: string; ru?: string; en?: string } | null;

interface BlogRecord {
  id: string;
  slug: string;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  coverUrl: string | null;
  publishedAt: string | null;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Paragraphs, split on blank lines. */
  paragraphs: string[];
  coverUrl: string | null;
  publishedAt: string | null;
}

const base = apiBase;

const pick = (text: Localized, locale: Locale) => text?.[locale] ?? text?.hy ?? '';

function toPost(record: BlogRecord, locale: Locale): BlogPost {
  return {
    id: record.id,
    slug: record.slug,
    title: pick(record.title, locale),
    excerpt: pick(record.excerpt, locale),
    paragraphs: pick(record.body, locale)
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    coverUrl: record.coverUrl,
    publishedAt: record.publishedAt,
  };
}

export async function listBlogPosts(locale: Locale = 'hy'): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${base()}/public/blog?take=100`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: BlogRecord[] };
    return data.items.map((record) => toPost(record, locale));
  } catch {
    return [];
  }
}

export async function getBlogPost(slug: string, locale: Locale = 'hy'): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${base()}/public/blog/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return toPost((await res.json()) as BlogRecord, locale);
  } catch {
    return null;
  }
}
