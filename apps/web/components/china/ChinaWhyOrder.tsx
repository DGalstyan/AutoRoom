import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';
import { getServerMessages } from '@/lib/i18n';

/** Photos for the five feature cards, in order (Figma 458:773). The second sits on black, uncropped. */
const PHOTOS = [
  '/images/china/why/why-1.jpg',
  '/images/china/why/why-2.jpg',
  '/images/china/why/why-3.jpg',
  '/images/china/why/why-4.jpg',
  '/images/china/why/why-5.jpg',
] as const;

/**
 * China "why order through AutoRoom" — a light section (Figma 458:773): a centred 44px light
 * title and five white 48px cards, each with the gold 01–05 number, title and text on the left
 * and a 556×356 photo on the right. From `lg`, each card pins under the header as the next one
 * scrolls up over it (the design's `sticky top-0` cards), so they stack.
 */
export async function ChinaWhyOrder() {
  const { messages } = await getServerMessages();
  const t = messages.china.whyOrder;

  return (
    <section className="bg-surface-light px-4 pb-16 pt-16 text-ink sm:px-6 lg:px-12 lg:pb-[150px] lg:pt-[150px]">
      <div className="mx-auto flex max-w-page flex-col gap-10 lg:gap-14">
        <h2 className="text-center text-[28px] font-light leading-[36px] sm:text-[44px] sm:leading-[58px]">
          {t.heading}
        </h2>

        <ol className="flex flex-col gap-6 lg:gap-8">
          {t.features.map((feature, index) => (
            <li key={feature.title} className="lg:sticky lg:top-[132px]">
              <Reveal delayMs={0}>
                <div className="flex flex-col gap-8 rounded-[32px] bg-white p-6 shadow-[0_8px_57px_rgba(0,0,0,0.03)] sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:rounded-[48px] lg:p-16">
                  <div className="flex min-w-0 flex-col gap-3 lg:max-w-[555px]">
                    <p
                      className="text-[36px] font-bold leading-[48px] text-accent lg:text-[52px] lg:leading-[66px]"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, '0')}.
                    </p>
                    <h3 className="text-[24px] leading-[32px] sm:text-[36px] sm:leading-[48px]">
                      {feature.title}
                    </h3>
                    <div className="text-[16px] leading-[24px] text-neutral-800 lg:text-[20px] lg:leading-[28px]">
                      {feature.text.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`relative aspect-[556/356] w-full shrink-0 overflow-hidden rounded-[32px] lg:w-[556px] lg:rounded-[48px] ${
                      index === 1 ? 'bg-[#010101]' : ''
                    }`}
                  >
                    <Image
                      src={PHOTOS[index]!}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 556px, 100vw"
                      className={index === 1 ? 'object-contain' : 'object-cover'}
                    />
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
