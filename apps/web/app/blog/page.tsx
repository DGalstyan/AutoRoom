import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { listBlogPosts } from '@/lib/blog';
import { getLocale, getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return { title: messages.blog.meta.title, description: messages.blog.meta.description };
}

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(
    locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : 'en-GB',
    {
      dateStyle: 'long',
    },
  );

/** `/blog` — the published articles, newest first, as a two-column card grid. */
export default async function BlogPage() {
  const locale = await getLocale();
  const [posts, { messages }] = await Promise.all([listBlogPosts(locale), getServerMessages()]);
  const t = messages.blog;

  return (
    <div className="bg-surface-light">
      <div className="mx-auto max-w-page px-4 pb-16 pt-32 sm:px-6 sm:pt-[185px] lg:px-12 lg:pb-[150px]">
        <h1 className="type-h2 text-ink">{t.heading}</h1>

        {posts.length === 0 ? (
          <p className="mt-10 text-lead text-muted">{t.empty}</p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:gap-12">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[32px] bg-white transition-transform duration-standard ease-expo hover:-translate-y-1"
                >
                  <div className="relative aspect-[3/2] w-full bg-neutral-100">
                    {post.coverUrl && (
                      <Image
                        src={post.coverUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 648px, 100vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
                    {post.publishedAt && (
                      <time
                        dateTime={post.publishedAt}
                        className="text-[14px] leading-5 text-neutral-700"
                      >
                        {formatDate(post.publishedAt, locale)}
                      </time>
                    )}
                    <h2 className="stretch-90 text-[24px] font-normal leading-9 text-ink">
                      {post.title}
                    </h2>
                    {post.excerpt && <p className="type-body text-neutral-800">{post.excerpt}</p>}
                    <span className="mt-auto pt-2 text-[14px] font-medium text-ink underline underline-offset-4 group-hover:text-accent-600">
                      {t.read}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
