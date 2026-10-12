import Link from 'next/link';
import { MachineryGlyph } from '@/components/machinery/MachineryGlyph';

/**
 * The third category of the direction picker: construction machinery. The two country cards carry
 * car renders at a fixed 597px width; this one is a wide strip beneath them (title, one line,
 * arrow, line drawing) so the row keeps the design's two cards and nothing is squeezed.
 */
export function MachineryCard({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex w-full max-w-[1320px] items-center justify-between gap-6 rounded-[48px] bg-white p-6 transition-shadow duration-standard ease-expo hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:p-8 lg:px-12 lg:py-8"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="stretch-90 text-[24px] font-bold leading-9 text-neutral-800">{title}</span>
        <span className="text-[16px] leading-6 text-neutral-700">{text}</span>
      </span>
      <span className="flex shrink-0 items-center gap-4 sm:gap-8">
        <MachineryGlyph className="hidden h-16 w-auto text-neutral-500 sm:block lg:h-24" />
        <span
          aria-hidden="true"
          className="flex size-16 items-center justify-center rounded-full bg-[rgba(127,127,127,0.1)] text-ink transition-colors duration-standard ease-expo group-hover:bg-accent"
        >
          <svg width="29" height="29" viewBox="0 0 29 29" fill="none">
            <path
              d="M8 21 21 8M21 8H10.5M21 8v10.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </Link>
  );
}
