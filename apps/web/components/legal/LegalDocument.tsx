import { Section } from '@/components/ui/Section';

export interface LegalBlock {
  type: string;
  text?: string;
  items?: string[];
}

export interface LegalContent {
  title: string;
  company: string;
  updated: string;
  sections: { heading: string; blocks: LegalBlock[] }[];
}

/** Shared layout for the static legal pages (`/privacy`, `/terms`) — text comes from the i18n message files. */
export function LegalDocument({ content }: { content: LegalContent }) {
  return (
    <Section tone="light" className="pt-32 sm:pt-40">
      <article className="mx-auto max-w-3xl [overflow-wrap:anywhere]">
        <h1 className="font-display text-h1 font-extrabold text-ink">{content.title}</h1>
        <p className="mt-2 text-body font-semibold text-ink/80">{content.company}</p>
        <p className="mt-1 text-small text-ink/60">{content.updated}</p>

        {content.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="font-display text-h3 font-bold text-ink">{section.heading}</h2>
            {section.blocks.map((block, i) =>
              block.type === 'ul' ? (
                <ul key={i} className="mt-3 list-disc space-y-2 pl-6 text-body text-ink/80">
                  {block.items?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : block.type === 'h3' ? (
                <h3 key={i} className="mt-5 text-body font-semibold text-ink">
                  {block.text}
                </h3>
              ) : (
                <p key={i} className="mt-3 text-body text-ink/80">
                  {block.text}
                </p>
              ),
            )}
          </section>
        ))}
      </article>
    </Section>
  );
}
