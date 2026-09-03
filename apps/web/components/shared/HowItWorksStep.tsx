import Image from 'next/image';

interface HowItWorksStepProps {
  index: number;
  title: string;
  text: string;
  image: string;
  /** The first step renders as a wide card carrying the full body copy; the
   * rest are narrow numbered strips (matches Figma node `110:594`, verified
   * via get_metadata: a ~3.2:1 wide:narrow width ratio, not 2.3:1). */
  wide?: boolean;
}

export function HowItWorksStep({ index, title, text, image, wide = false }: HowItWorksStepProps) {
  const label = index === 0 ? `${index + 1}. ${title}` : title;

  return (
    <div
      className={`group relative shrink-0 overflow-hidden rounded-xl lg:shrink ${
        wide
          ? 'aspect-[452/564] w-[294px] sm:w-[352px] lg:w-0 lg:flex-[3.2]'
          : 'aspect-[141/564] w-[92px] sm:w-[110px] lg:w-0 lg:flex-1'
      }`}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes={wide ? '(min-width: 1024px) 28vw, 352px' : '(min-width: 1024px) 12vw, 110px'}
        className="object-cover transition-transform duration-standard ease-expo group-hover:scale-105"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <p
          className={
            wide
              ? 'font-display text-[24px] font-light leading-[36px] text-white'
              : 'font-display text-[16px] font-medium leading-[20px] text-white'
          }
        >
          {label}
        </p>
        {wide && <p className="mt-2 hidden text-caption text-white/80 sm:block">{text}</p>}
        {!wide && <span className="sr-only">{text}</span>}
      </div>
    </div>
  );
}
