import type { ReactNode } from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';
import { getServerMessages } from '@/lib/i18n';

const IMG = '/images/china/services';

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
    <section aria-label={t.label} className="bg-ink px-4 py-9 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1344px] flex-col gap-4 lg:gap-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card tone="light" index={0}>
            <div className="absolute left-1/2 top-6 flex w-[calc(100%-36px)] max-w-[401px] -translate-x-1/2 items-end justify-center gap-4">
              <p className="stretch-90 w-[229px] min-w-0 shrink text-[14px] font-medium leading-[18px] text-neutral-700">
                {t.import.eyebrow}
              </p>
              <h3 className="stretch-90 shrink-0 whitespace-nowrap text-[24px] font-bold leading-9 text-ink">
                {t.import.title}
              </h3>
            </div>
            <Photo
              src={`${IMG}/import-render.webp`}
              className="absolute left-1/2 top-[97px] h-[296px] w-[calc(100%-36px)] max-w-[401px] -translate-x-1/2 rounded-[24px]"
              sizes="401px"
            />
          </Card>

          <Card tone="dark" index={1}>
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

          <Card tone="light" index={2}>
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
                className="absolute right-0 top-[210px] h-[92px] w-[134px] rounded-[24px]"
                sizes="134px"
              />
              <IconTile className="absolute left-0 top-[254px]">
                <Image src={`${IMG}/icon-route.svg`} alt="" width={23} height={23} />
              </IconTile>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[437px_1fr]">
          <Card tone="dark" index={3}>
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
            <div className="absolute left-6 top-[326px] flex items-center gap-3">
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

          <Card tone="light" index={4} className="px-6 py-[25px]">
            <div className="flex flex-col gap-[68px]">
              <h3 className="stretch-90 whitespace-nowrap text-[24px] font-bold leading-9 text-ink">
                {t.chinese.title}
              </h3>
              <div className="overflow-hidden rounded-[32px] bg-accent px-6 py-[18px]">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 2, 1].map((n, i) => (
                    <span
                      key={i}
                      className="relative aspect-[4096/2820] min-w-0 flex-1 overflow-hidden rounded-[24px]"
                    >
                      <Image
                        src={`${IMG}/chinese-${n}.webp`}
                        alt=""
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

        <div className="grid gap-4 lg:grid-cols-3">
          <Card tone="dark" index={5}>
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

          <Card tone="light" index={6}>
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
                className="h-[296px] w-full rounded-[24px]"
                sizes="421px"
                contain
              />
            </div>
          </Card>

          <Card tone="dark" index={7}>
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
                alt=""
                width={900}
                height={1200}
                sizes="190px"
                className="absolute left-[-29.83%] top-[-88.98%] h-[271.74%] w-[139.93%] max-w-none"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({
  tone,
  index,
  className = '',
  children,
}: {
  tone: 'light' | 'dark';
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Reveal delayMs={(index % 3) * 80} className="h-full">
      <div
        className={`relative h-[417px] overflow-hidden rounded-[32px] transition-transform duration-standard ease-expo hover:-translate-y-1 ${
          tone === 'light' ? 'bg-white' : 'bg-neutral-800'
        } ${className}`}
      >
        {children}
      </div>
    </Reveal>
  );
}

function Photo({
  src,
  className,
  sizes,
  contain = false,
}: {
  src: string;
  className: string;
  sizes: string;
  contain?: boolean;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <Image
        src={src}
        alt=""
        width={900}
        height={900}
        sizes={sizes}
        className={`h-full w-full ${contain ? 'object-contain' : 'object-cover'}`}
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
