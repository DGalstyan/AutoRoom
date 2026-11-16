import type { Metadata } from 'next';
import { MachineryCard, type MachineryArt } from '@/components/china/MachineryCard';
import { getServerMessages } from '@/lib/i18n';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return pageMetadata({
    title: messages.chinaMachinery.meta.title,
    description: messages.chinaMachinery.meta.description,
  });
}

const IMG = '/images/machinery';

/**
 * Render placement per machine, read from Figma node 503:936 ("Tech", file 9Lq4XpWusTJj1VnM6laAZr).
 * Order is row by row: left card, right card. Left cards use the 593px wrapper, right ones the 591px one.
 */
const ART: MachineryArt[] = [
  {
    src: `${IMG}/excavator.png`,
    box: { x: 220, y: 171, w: 392, h: 375 },
    crop: { h: 104.47, l: 0, t: 0, w: 100 },
  },
  {
    src: `${IMG}/wheel-loader.png`,
    box: { x: 0, y: 251, w: 392, h: 263 },
    crop: { h: 149.05, l: 0, t: -23.76, w: 100 },
    // Figma 503:743: the loader grows to 484×324 and moves to (-46, 215.5).
    hover: { dx: -46, dy: -35.5, scale: 1.235 },
  },
  {
    src: `${IMG}/bulldozer.png`,
    box: { x: 204, y: 177, w: 423, h: 405 },
    crop: { h: 105.33, l: -0.41, t: 0, w: 100.83 },
  },
  {
    src: `${IMG}/forklift.png`,
    box: { x: -82, y: 239, w: 452, h: 303 },
    crop: { h: 149.05, l: 0, t: -23.76, w: 100 },
    flip: true,
  },
  {
    src: `${IMG}/crane.png`,
    box: { x: 202, y: 162, w: 399, h: 393 },
    crop: { h: 102.55, l: -0.41, t: 0, w: 100.83 },
  },
  {
    src: `${IMG}/road-roller.png`,
    box: { x: -73, y: 239, w: 482, h: 323 },
    flip: true,
  },
  {
    src: `${IMG}/grader.png`,
    box: { x: 159, y: 262, w: 494, h: 229 },
    crop: { h: 217.85, l: -0.41, t: -58.38, w: 100.83 },
    flip: true,
  },
  {
    src: `${IMG}/backhoe.png`,
    box: { x: -52, y: 209, w: 482, h: 353 },
    crop: { h: 136.54, l: 0, t: -14.02, w: 100 },
  },
];

/**
 * `/china/machinery` — "Շինարարական տեխնիկա Չինաստանից" (Figma 503:911): a centred 44px light
 * heading over a two-column grid of eight machine tiles, each opening the offer popup with
 * "Construction machinery" pre-selected.
 */
export default async function ChinaMachineryPage() {
  const { messages } = await getServerMessages();
  const t = messages.chinaMachinery;

  return (
    <div className="overflow-x-clip bg-surface-light pb-16 pt-32 text-ink sm:pt-[213px] lg:pb-[150px]">
      <div className="mx-auto flex max-w-page flex-col gap-10 px-4 sm:px-6 lg:gap-16 lg:px-12">
        <h1 className="text-center text-[28px] font-light leading-[1.3] sm:text-[36px] lg:text-[44px] lg:leading-[58px]">
          {t.heading}
        </h1>
        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-[593fr_591fr] lg:justify-between lg:gap-x-[160px] lg:gap-y-16">
          {t.items.map((item, index) => (
            <li
              key={item.slug}
              className={`flex ${index % 2 === 0 ? 'lg:justify-start' : 'lg:justify-end'}`}
            >
              <MachineryCard
                name={item.name}
                badge={t.badge}
                requestLabel={t.requestLabel}
                side={index % 2 === 0 ? 'left' : 'right'}
                art={ART[index]}
                priority={index < 2}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
