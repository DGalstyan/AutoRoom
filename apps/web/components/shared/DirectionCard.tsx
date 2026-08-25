import Link from 'next/link';
import Image from 'next/image';

interface DirectionCardProps {
  href: string;
  title: string;
  image: string;
  imageAlt: string;
}

/**
 * Homepage hero direction picker card ("ԱՄՆ" / "Չինաստան") — white rounded
 * card, title + circular arrow top, car render bottom. Matches Figma node
 * `9321:6266` ("Country" instances).
 */
export function DirectionCard({ href, title, image, imageAlt }: DirectionCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-xl bg-white p-6 shadow-card transition-transform duration-standard ease-expo hover:-translate-y-1 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-display text-home-card-title font-bold text-neutral-800">
          {title}
        </span>
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-surface-light text-ink transition-colors duration-standard group-hover:bg-accent group-hover:text-ink"
        >
          <ArrowGlyph />
        </span>
      </div>
      <div className="relative mt-6 aspect-[597/258] w-full">
        <Image src={image} alt={imageAlt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-contain" />
      </div>
    </Link>
  );
}

function ArrowGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 12 12 4M12 4H5M12 4v7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
