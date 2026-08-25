import Image from 'next/image';

interface HowItWorksStepProps {
  index: number;
  title: string;
  text: string;
  image: string;
  /** The first step renders as a wide card carrying the full body copy; the
   * rest are narrow numbered strips (matches Figma node `9321:6346`). */
  wide?: boolean;
}

export function HowItWorksStep({ index, title, text, image, wide = false }: HowItWorksStepProps) {
  const label = index === 0 ? `${index + 1}. ${title}` : title;

  return (
    <div
      className={`group relative shrink-0 overflow-hidden rounded-xl lg:shrink ${
        wide
          ? 'aspect-[452/564] w-[220px] sm:w-[280px] lg:w-0 lg:flex-[2.3]'
          : 'aspect-[141/564] w-[92px] sm:w-[110px] lg:w-0 lg:flex-1'
      }`}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes={wide ? '(min-width: 1024px) 28vw, 280px' : '(min-width: 1024px) 12vw, 110px'}
        className="object-cover transition-transform duration-standard ease-expo group-hover:scale-105"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <p className="font-display text-small font-normal leading-tight text-white sm:text-lead">
          {label}
        </p>
        {wide && <p className="mt-2 hidden text-caption text-white/80 sm:block">{text}</p>}
        {!wide && <span className="sr-only">{text}</span>}
      </div>
    </div>
  );
}
