'use client';

import { useMessages } from '@/components/shared/LocaleProvider';

/**
 * `/partners` S2 "Why partner" — 8 benefit cards, verified against both
 * Figma (node 291:732's `Metrics` group, file 9Lq4XpWusTJj1VnM6laAZr) and
 * `references/pages.md`'s own S2 list, which match exactly. The 3rd
 * ("Անձնական մենեջեր") and 5th ("Արագ հաշվարկներ") cards are visually
 * distinct in Figma (gold and near-black respectively) — reproduced as
 * `accent`/`bg` tone variants rather than plain white, matching the mockup.
 */
export function PartnersWhy() {
  const t = useMessages().partners.why;

  return (
    <section className="bg-surface-light px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-container">
        <h2 className="text-center font-display text-home-h2 font-light text-ink">{t.heading}</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.items.map((item, index) => {
            const tone = index === 2 ? 'accent' : index === 4 ? 'dark' : 'light';
            return (
              <div
                key={item.title}
                className={`flex flex-col gap-1 rounded-2xl p-6 ${
                  tone === 'accent'
                    ? 'bg-accent text-neutral-900'
                    : tone === 'dark'
                      ? 'bg-bg text-white'
                      : 'bg-white text-ink'
                }`}
              >
                <p className="font-display text-[20px] font-bold leading-[28px]">{item.title}</p>
                {item.text && (
                  <p className={`text-lead ${tone === 'light' ? 'text-ink/70' : 'opacity-80'}`}>
                    {item.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
