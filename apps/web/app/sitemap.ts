import type { MetadataRoute } from 'next';
import { listBlogPosts } from '@/lib/blog';
import { listCars } from '@/lib/cars';
import { siteOrigin } from '@/lib/siteOrigin';
import { carHref } from '@/lib/types/car';
import type { Car } from '@/lib/types/car';

/** Public pages with no data behind them. Account, portal, compare and API routes are left out on purpose. */
const STATIC_PATHS = [
  '/',
  '/china',
  '/usa',
  '/offers',
  '/machinery',
  '/partners',
  '/about',
  '/contact',
  '/faq',
  '/blog',
  '/privacy',
  '/terms',
];

/** The API caps a page at 100 cars; walk it until everything is listed (bounded, so a bad `total` cannot loop). */
async function allCars(): Promise<Car[]> {
  const cars: Car[] = [];
  for (let skip = 0; skip < 5_000; skip += 100) {
    const { items, total } = await listCars({ take: 100, skip });
    cars.push(...items);
    if (items.length < 100 || cars.length >= total) break;
  }
  return cars;
}

/** `/sitemap.xml` — static pages, every published car's page, and the blog posts. Never throws: an unreachable API just shortens the list. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const [cars, posts] = await Promise.all([allCars(), listBlogPosts().catch(() => [])]);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${origin}${path === '/' ? '' : path}` })),
    ...cars.map((car) => ({
      url: `${origin}${carHref(car)}`,
      ...(car.updatedAt ? { lastModified: car.updatedAt } : {}),
    })),
    ...posts.map((post) => ({ url: `${origin}/blog/${post.slug}` })),
  ];
}
