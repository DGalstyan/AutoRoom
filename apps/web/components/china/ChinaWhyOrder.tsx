import { Reveal } from '@/components/ui/Reveal';
import { getServerMessages } from '@/lib/i18n';

/** Visible heights of the connectors between the five numbered steps (Figma 438:1344–1353). */
const CONNECTOR_HEIGHTS = [48, 54, 46, 60];

/**
 * China "why order through AutoRoom" — the black numbered 01–05 feature list
 * (Figma `Text` 438:1339): 110px/48px padding, a 60px number rail and 760px
 * glass cards 40px apart, centred on the page. The light photo/checklist panel
 * that used to sit above it is not in the current design.
 */
export async function ChinaWhyOrder() {
  const { messages } = await getServerMessages();
  const t = messages.china.whyOrder;

  return (
    <section
      aria-label={t.heading}
      className="flex justify-center bg-ink px-4 py-[70px] sm:px-12 sm:py-[110px]"
    >
      <div className="flex w-full max-w-[860px] gap-4 sm:gap-10">
        <ol className="flex w-[50px] shrink-0 flex-col items-center gap-[7px] pt-[35px] sm:w-[60px]">
          {t.features.map((feature, index) => (
            <li key={feature.title} className="contents">
              <span className="flex size-[50px] items-center justify-center rounded-full bg-white/10 text-[16px] font-medium text-white">
                {String(index + 1).padStart(2, '0')}
              </span>
              {index < t.features.length - 1 && (
                <span
                  className="-my-px w-[2px] rounded-full bg-neutral-700"
                  style={{ height: CONNECTOR_HEIGHTS[index] + 2 }}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {t.features.map((feature, index) => (
            <Reveal key={feature.title} delayMs={index * 60}>
              <div className="rounded-[20px] bg-white/10 p-4">
                <h3 className="stretch-90 text-[16px] font-bold leading-[24px] text-white">
                  {feature.title}
                </h3>
                <div className="mt-3 text-[12px] leading-[16px] text-neutral-50">
                  {feature.text.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
