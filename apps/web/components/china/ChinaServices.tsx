import type { ReactNode } from 'react';
import Image from 'next/image';
import { ScrollRise } from '@/components/ui/ScrollRise';
import { getServerMessages } from '@/lib/i18n';

const IMG = '/images/china/services';

/** The prototype's card transitions (Figma 471:914's variants): Smart Animate with Gentle / Ease-out / Bouncy easing. */
const GENTLE = 'duration-[1020ms] ease-[cubic-bezier(0.3,1.1,0.5,1)]';
const EASE_OUT = 'duration-300 ease-out';
const BOUNCY = 'duration-[960ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]';

/**
 * China "services" bento — Figma `Services` (438:844): a black 1440×1387 band
 * holding three rows of 417px cards (3 · 2 · 3) at 16px/32px gaps inside the
 * 1344px column. (The design file draws the grid offset below the frame's
 * visible area; the 36px padding + 3×417 + 2×32 = 1387 only adds up with it
 * filling the frame, so that is how it is built.) Below `lg` the cards stack.
 */
export async function ChinaServices() {
  const { messages } = await getServerMessages();
  const t = messages.china.services;

  return (
    <section aria-label={t.label} className="overflow-hidden bg-ink px-4 py-9 sm:px-6 lg:px-12">
      <ScrollRise
        distance={700}
        settleAt={36}
        className="mx-auto flex max-w-[1344px] flex-col gap-4 lg:gap-8"
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
          {/* Figma 471:801/471:806: title and line top-left; the car cut-out sits low and slides up-left on hover. */}
          <Card tone="light">
            <div className="absolute left-[43.5px] top-[47px] flex w-[calc(100%-87px)] max-w-[351px] flex-col gap-4">
              <h3 className="stretch-90 text-[24px] font-bold leading-9 text-ink">
                {t.import.title}
              </h3>
              <p className="stretch-90 text-[14px] font-medium leading-[18px] text-neutral-700">
                {t.import.eyebrow}
              </p>
            </div>
            <Image
              src={`${IMG}/import-car.png`}
              alt={t.import.title}
              width={660}
              height={440}
              sizes="360px"
              // The Figma fill carries contrast +0.36 / saturation -0.8, applied here as a filter.
              style={{ filter: 'contrast(1.36) saturate(0.2)' }}
              className={`absolute left-[calc(50%-123px)] top-[245px] h-[240px] w-[360px] max-w-none transition-transform ${GENTLE} motion-safe:group-hover:-translate-y-[68px] motion-safe:group-hover:translate-x-[-33.5px]`}
            />
          </Card>

          <Card tone="dark">
            <div className="absolute left-1/2 top-1/2 flex w-[calc(100%-36px)] max-w-[401px] -translate-x-1/2 -translate-y-1/2 flex-col gap-[37px]">
              <div className="flex flex-col gap-6">
                <h3 className="stretch-90 text-[24px] font-bold leading-9 text-white">
                  {t.auctions.title[0]}
                  <br />
                  {t.auctions.title[1]}
                </h3>
                <hr className="border-0 border-t border-neutral-800" />
              </div>
              <p className="stretch-90 text-[14px] font-medium leading-[18px] text-neutral-500">
                {t.auctions.text}
              </p>
            </div>
          </Card>

          <Card tone="light">
            <div className="absolute left-6 top-[calc(50%+14.5px)] h-[302px] w-[calc(100%-36px)] max-w-[401px] -translate-y-1/2">
              <div className="flex flex-col gap-[18px]">
                <hr className="border-0 border-t border-neutral-100" />
                <div className="flex flex-col gap-6">
                  <h3 className="stretch-90 whitespace-nowrap text-[24px] font-bold leading-9 text-ink">
                    {t.logistics.title}
                  </h3>
                  <p className="stretch-90 w-[192.5px] text-[14px] font-medium leading-[18px] text-neutral-700">
                    {t.logistics.text[0]}
                    <br />
                    {t.logistics.text[1]}
                  </p>
                </div>
              </div>
              <Photo
                src={`${IMG}/logistics-port.webp`}
                alt={t.logistics.title}
                className="absolute right-0 top-[210px] h-[92px] w-[134px] rounded-[24px]"
                sizes="134px"
              />
              <IconTile className="absolute left-0 top-[254px]">
                {/* Figma 471:823: the route icon grows 41→60 and goes from near-white to #666E73 (ease-out, 0.3s). */}
                <span
                  aria-hidden="true"
                  className={`block size-[23px] bg-[#fafafa] transition-[transform,background-color] ${EASE_OUT} motion-safe:group-hover:scale-[1.46] motion-safe:group-hover:bg-neutral-700`}
                  style={{
                    WebkitMask: `url(${IMG}/icon-route.svg) center / contain no-repeat`,
                    mask: `url(${IMG}/icon-route.svg) center / contain no-repeat`,
                  }}
                />
              </IconTile>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[437px_1fr]">
          <Card tone="dark">
            <div className="absolute left-6 top-[calc(50%+14.5px)] h-[302px] w-[calc(100%-36px)] max-w-[401px] -translate-y-1/2">
              <div className="flex flex-col gap-[18px]">
                <hr className="border-0 border-t border-neutral-700" />
                <div className="flex flex-col gap-6">
                  <h3 className="stretch-90 whitespace-nowrap text-[24px] font-bold leading-9 text-white">
                    {t.customs.title}
                  </h3>
                  <p className="stretch-90 w-[192.5px] text-[14px] font-medium leading-[18px] text-neutral-100">
                    {t.customs.text[0]}
                    <br />
                    {t.customs.text[1]}
                  </p>
                </div>
              </div>
            </div>
            {/* Figma 471:835/471:853: a clipped 47px frame that opens to 228px on hover, revealing the whole chain.
              Without hover (touch) or with reduced motion the chain simply stays open. */}
            <div
              className={`absolute left-6 top-[326px] flex w-[47px] items-center gap-3 overflow-hidden transition-[width] ${GENTLE} group-hover:w-[228px] motion-reduce:w-[228px] [&>*]:shrink-0 [@media(hover:none)]:w-[228px]`}
            >
              <IconTile>
                <Image src={`${IMG}/icon-paper.svg`} alt="" width={24} height={24} />
              </IconTile>
              <Arrow />
              <span className="flex h-[48.25px] items-center rounded-[9px] bg-[#6e6e6e] px-[11px]">
                <Image src={`${IMG}/icon-check.svg`} alt="" width={24} height={24} />
              </span>
              <Arrow />
              <IconTile gold>
                <Image src={`${IMG}/icon-car-front.svg`} alt="" width={31} height={31} />
              </IconTile>
            </div>
          </Card>

          <Card tone="light" className="px-6 py-[25px]">
            <div className="flex flex-col gap-[68px]">
              <h3 className="stretch-90 whitespace-nowrap text-[24px] font-bold leading-9 text-ink">
                {t.chinese.title}
              </h3>
              <div className="overflow-hidden rounded-[32px] bg-accent px-6 py-[18px]">
                <div
                  className={`flex items-center gap-1 transition-transform ${GENTLE} motion-safe:group-active:scale-[1.026]`}
                >
                  {[1, 2, 3, 2, 1].map((n, i) => (
                    <span
                      key={i}
                      className="relative aspect-[4096/2820] min-w-0 flex-1 overflow-hidden rounded-[24px]"
                    >
                      <Image
                        src={`${IMG}/chinese-${n}.webp`}
                        alt={t.chinese.title}
                        fill
                        sizes="170px"
                        className="object-cover"
                      />
                    </span>
                  ))}
                </div>
              </div>
              <p className="stretch-90 text-[14px] font-medium leading-[18px] text-neutral-700">
                {t.chinese.text[0]}
                <br />
                {t.chinese.text[1]}
                <br />
                {t.chinese.text[2]}
              </p>
            </div>
            <IconTile className="absolute right-6 top-[25px]">
              <Image src={`${IMG}/icon-car.svg`} alt="" width={47} height={47} />
            </IconTile>
          </Card>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
          <Card tone="dark">
            <div className="absolute left-1/2 top-1/2 flex w-[calc(100%-36px)] max-w-[401px] -translate-x-1/2 -translate-y-1/2 flex-col gap-[37px]">
              <div className="flex flex-col gap-6">
                <h3 className="stretch-90 text-[24px] font-bold leading-9 text-white">
                  {t.financing.title}
                </h3>
                <hr className="border-0 border-t border-neutral-800" />
              </div>
              <div className="stretch-90 flex flex-col gap-4 text-[14px] font-medium leading-[18px] text-neutral-500">
                <p>{t.financing.text[0]}</p>
                <p>{t.financing.text[1]}</p>
              </div>
            </div>
          </Card>

          <Card tone="light">
            <div className="absolute left-1/2 top-[14px] flex w-[calc(100%-64px)] max-w-[373px] -translate-x-1/2 flex-wrap items-end justify-between gap-x-3 gap-y-1">
              <p className="stretch-90 max-w-[150px] text-[14px] font-medium leading-[18px] text-neutral-700">
                {t.b2b.eyebrow}
              </p>
              <h3 className="stretch-85 max-w-full text-[24px] font-bold leading-[31px] text-ink">
                {t.b2b.title}
              </h3>
            </div>
            <div className="absolute left-1/2 top-[97px] w-[calc(100%-16px)] max-w-[421px] -translate-x-1/2 rounded-[24px] bg-[linear-gradient(127deg,#cbad5a_4.5%,#caaf59_96.4%)]">
              <Photo
                src={`${IMG}/b2b-render.webp`}
                alt={t.b2b.title}
                className="h-[296px] w-full rounded-[24px]"
                sizes="421px"
                contain
                // Figma 471:908: the render grows 3.9% and drifts 9.5px left / 7px up, with a bounce.
                imageClassName={`origin-top-left transition-transform ${BOUNCY} motion-safe:group-hover:[transform:translate(-9.5px,-7px)_scale(1.039)]`}
              />
            </div>
          </Card>

          <Card tone="dark">
            <div className="absolute left-1/2 top-[calc(50%-75px)] flex w-[calc(100%-36px)] max-w-[401px] -translate-x-1/2 -translate-y-1/2 flex-col gap-[37px]">
              <div className="flex flex-col gap-6">
                <h3 className="stretch-90 text-[24px] font-bold leading-9 text-white">
                  {t.shipping.title}
                </h3>
                <hr className="border-0 border-t border-neutral-800" />
              </div>
              <p className="stretch-90 whitespace-nowrap text-[14px] font-medium leading-[18px] text-neutral-500">
                {t.shipping.text[0]}
                <br />
                {t.shipping.text[1]}
                <br />
                {t.shipping.text[2]}
              </p>
            </div>
            <p
              aria-hidden="true"
              className="absolute right-[24px] top-[321px] whitespace-nowrap text-[41.222px] font-normal leading-[53px] text-neutral-500"
            >
              {t.availability}
            </p>
            <div className="absolute left-6 top-[282px] h-[92px] w-[134px] overflow-hidden rounded-[24px]">
              <Image
                src={`${IMG}/shipping-port.webp`}
                alt={t.shipping.title}
                width={900}
                height={1200}
                sizes="190px"
                className="absolute left-[-29.83%] top-[-88.98%] h-[271.74%] w-[139.93%] max-w-none"
              />
            </div>
          </Card>
        </div>
      </ScrollRise>
    </section>
  );
}

function Card({
  tone,
  className = '',
  children,
}: {
  tone: 'light' | 'dark';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="h-full">
      <div
        className={`group relative h-[417px] overflow-hidden rounded-[32px] ${
          tone === 'light' ? 'bg-white' : 'bg-neutral-800'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function Photo({
  src,
  alt,
  className,
  sizes,
  contain = false,
  imageClassName = '',
}: {
  src: string;
  /** What the picture shows — the title of the card it sits in. */
  alt: string;
  className: string;
  sizes: string;
  contain?: boolean;
  imageClassName?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={900}
        height={900}
        sizes={sizes}
        className={`h-full w-full ${contain ? 'object-contain' : 'object-cover'} ${imageClassName}`}
      />
    </div>
  );
}

function IconTile({
  children,
  className = '',
  gold = false,
}: {
  children: ReactNode;
  className?: string;
  gold?: boolean;
}) {
  return (
    <span
      className={`flex h-[48.25px] w-[47px] items-center justify-center overflow-hidden rounded-[9px] ${
        gold ? 'bg-accent' : 'bg-[#6e6e6e]'
      } ${className}`}
    >
      {children}
    </span>
  );
}

function Arrow() {
  return <Image src={`${IMG}/icon-arrow.svg`} alt="" width={21} height={15} className="w-5" />;
}
