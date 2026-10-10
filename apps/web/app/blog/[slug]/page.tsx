import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPost } from '@/lib/blog';
import { getLocale, getServerMessages } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug, await getLocale());
  if (!post) return {};
  return { title: `${post.title} — AutoRoom`, description: post.excerpt || undefined };
}

/** `/blog/[slug]` — one article: a 760px reading column under the title and cover. */
export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const [post, { messages }] = await Promise.all([getBlogPost(slug, locale), getServerMessages()]);
  if (!post) notFound();
  const t = messages.blog;

  return (
    <div className="bg-surface-light">
      <article className="mx-auto max-w-page px-4 pb-16 pt-32 sm:px-6 sm:pt-[185px] lg:px-12 lg:pb-[150px]">
        <Link
          href="/blog"
          className="inline-flex min-h-11 items-center text-[14px] font-medium text-ink underline underline-offset-4 hover:text-accent-600"
        >
          ← {t.back}
        </Link>
        <h1 className="type-h2 mt-4 text-ink">{post.title}</h1>
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="mt-3 block text-[14px] text-neutral-700">
            {new Date(post.publishedAt).toLocaleDateString(
              locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : 'en-GB',
              { dateStyle: 'long' },
            )}
          </time>
        )}

        {post.coverUrl && (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-[32px] bg-neutral-100 lg:mt-12">
            <Image
              src={post.coverUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 1344px) 1344px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="mx-auto mt-8 flex max-w-[760px] flex-col gap-6 text-[18px] leading-[30px] text-neutral-800 lg:mt-12 [&>p]:[overflow-wrap:anywhere]">
          {post.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
