import Image from 'next/image';
import { getServerMessages } from '@/lib/i18n';

/**
 * China S4b — "Ինչո՞ւ Չինաստանից պատվիրել AutoRoom-ի միջոցով": a light
 * section (heading + photo/glass-panel checklist, same treatment as the
 * Homepage Ecosystem section — Figma node 101:437/101:440) followed by a
 * full-bleed dark numbered 01–05 feature list (node 101:450, `w-full` at the
 * page's own width in Figma, not container-constrained). Manages its own
 * section wrappers rather than being dropped inside `<Section>`, since the
 * second half deliberately breaks out of the page's usual 1280px column.
 */
export async function ChinaWhyOrder() {
  const { messages } = await getServerMessages();
  const t = messages.china.whyOrder;

  return (
    <>
      <section className="bg-surface-light px-4 py-14 text-ink sm:px-6 sm:py-24">
        <div className="mx-auto flex max-w-container flex-col gap-14">
          <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>

          <div className="relative overflow-visible rounded-[32px]">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[32px] sm:aspect-[980/551]">
              <Image
                src="/images/china/ecosystem-strip.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 980px, 100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/0 to-[95.372%] to-black/[0.89]"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4 px-4 sm:absolute sm:right-0 sm:top-[16%] sm:mt-0 sm:w-[90%] sm:max-w-[473px] sm:px-0 sm:pr-4">
              <ul className="flex flex-col gap-3 rounded-[32px] bg-white/[0.42] p-8">
                {t.ecosystem.map((item) => (
                  <li key={item} className="text-[20px] font-normal leading-[28px] text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="flex justify-center bg-ink px-6 py-[70px] sm:px-12 sm:py-[110px]">
        <div className="flex w-full max-w-[860px] gap-6 sm:gap-10">
          <ol className="flex shrink-0 flex-col items-center gap-[7px] pt-[35px]">
            {t.features.map((feature, index) => (
              <li key={feature.title} className="contents">
                <span className="flex size-[50px] items-center justify-center rounded-full bg-white/10 text-[16px] font-medium text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {index < t.features.length - 1 && (
                  <span className="h-12 w-px bg-white/20" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>

          <div className="flex flex-1 flex-col gap-3">
            {t.features.map((feature) => (
              <div key={feature.title} className="rounded-[20px] bg-white/10 p-4">
                <p className="text-[16px] font-bold leading-[24px] text-white">{feature.title}</p>
                <div className="mt-3 text-[12px] leading-[16px] text-neutral-50">
                  {feature.text.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
