import Image from 'next/image';
import Link from 'next/link';

/**
 * One "Country" card of the direction picker (Figma 436:2024 / 436:2025). The
 * white card is inset inside a slightly wider box so the car render — drawn at
 * the box's full width along its bottom — bleeds out past the card's left and
 * right edges, exactly as in the design. Everything is positioned in % of the
 * box so it scales down on phones.
 */
export function CountryCard({
  href,
  title,
  image,
  imageAlt,
  size,
}: {
  href: string;
  title: string;
  image: string;
  imageAlt: string;
  size: 'usa' | 'china';
}) {
  const g =
    size === 'usa'
      ? {
          box: 'lg:flex-1 min-[1400px]:w-[597px] min-[1400px]:flex-none aspect-[597/546]',
          card: 'left-[7.71%] right-[2.68%] top-0 bottom-[0.73%]',
          title: 'left-[calc(7.71%+24px)] top-6',
          arrow: 'right-[calc(2.68%+24px)] top-6',
          img: 'aspect-[597/258] ',
          imgW: 597,
          imgH: 258,
        }
      : {
          box: 'lg:flex-1 min-[1400px]:w-[588px] min-[1400px]:flex-none aspect-[588/546]',
          card: 'left-[7.14%] right-[1.87%] top-[0.37%] bottom-[0.37%]',
          title: 'left-[calc(7.14%+24px)] top-[26px]',
          arrow: 'right-[calc(1.87%+24px)] top-[26px]',
          img: 'aspect-[588/264]',
          imgW: 588,
          imgH: 264,
        };

  return (
    <Link
      href={href}
      className={`group relative block w-full max-w-[597px] ${g.box} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}
    >
      <span
        className={`absolute rounded-[48px] bg-white transition-shadow duration-standard ease-expo group-hover:shadow-card ${g.card}`}
        aria-hidden="true"
      />
      <span
        className={`stretch-90 absolute text-[24px] font-bold leading-9 text-neutral-800 ${g.title}`}
      >
        {title}
      </span>
      <span
        aria-hidden="true"
        className={`absolute flex size-16 items-center justify-center rounded-full bg-[rgba(127,127,127,0.1)] text-ink transition-colors duration-standard ease-expo group-hover:bg-accent ${g.arrow}`}
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
      <span
        className={`absolute inset-x-0 bottom-0 block transition-transform duration-[600ms] ease-expo group-hover:-translate-y-2 ${g.img}`}
      >
        <Image
          src={image}
          alt={imageAlt}
          width={g.imgW * 2}
          height={g.imgH * 2}
          sizes="(min-width: 1024px) 597px, 100vw"
          className="h-full w-full object-contain"
        />
      </span>
    </Link>
  );
}
