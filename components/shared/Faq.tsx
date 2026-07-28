import { Accordion } from '@/components/ui';
import { getFaqEntries, type FaqEntry, type FaqTopic } from '@/data/faq';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * FAQ accordion. Topic-keyed rather than content-keyed: a page names the topics
 * it covers and the entries come from `data/faq.ts`, so the Homepage's
 * "auto-aggregate China + USA" requirement is `topics={['general','china','usa']}`
 * and nothing else.
 *
 * A server component — the expand/collapse behaviour lives in `Accordion`.
 */

export interface FaqProps {
  topics: FaqTopic[];
  title?: string;
  /** Trim to the first N (Contact page shows 3–4 quick answers). */
  limit?: number;
  className?: string;
  children?: React.ReactNode;
}

export function Faq({ topics, title, limit, className, children }: FaqProps) {
  const entries = getFaqEntries(topics);
  const shown = limit ? entries.slice(0, limit) : entries;

  if (shown.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-8', className)}>
      <h2 className="text-h2">{title ?? t('faq.title')}</h2>
      <Accordion items={shown.map(toAccordionItem)} />
      {children}
    </section>
  );
}

function toAccordionItem(entry: FaqEntry) {
  return {
    id: entry.id,
    question: entry.question,
    // Several answers are multi-line (the payment stages list); newlines in the
    // source string are meaningful, so they render as paragraphs.
    answer: (
      <div className="flex flex-col gap-2">
        {(entry.answer ?? '').split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    ),
  };
}
