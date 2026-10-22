import { GlassButton } from '@/components/home/GlassButton';
import { getServerMessages } from '@/lib/i18n';

/**
 * Localized 404 (Figma 468:738): a black page with a light "Whoops!" title, one line of copy, an
 * outlined gold "404" and the glass "Back to homepage" pill. The copy rises in one line at a time,
 * the numerals draw themselves, then breathe softly; reduced motion shows the finished page
 * (`globals.css` collapses every animation).
 */
export default async function NotFound() {
  const { messages } = await getServerMessages();
  const t = messages.common.notFound;
  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center gap-6 bg-ink px-4 pb-16 pt-32 text-center text-white">
      <div className="flex flex-col items-center gap-3">
        <h1 className="nf-rise text-[44px] font-normal leading-[1.1] sm:text-[56px]">
          {t.heading}
        </h1>
        <p
          className="nf-rise text-[18px] leading-7 sm:text-[24px] sm:leading-8"
          style={{ animationDelay: '120ms' }}
        >
          {t.body}
        </p>
      </div>

      <svg
        viewBox="0 0 440 180"
        role="img"
        aria-label="404"
        className="nf-float my-6 h-auto w-[min(86vw,420px)] overflow-visible"
      >
        <defs>
          <linearGradient id="nf-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e3c15f" />
            <stop offset="0.5" stopColor="#8a6a1f" />
            <stop offset="1" stopColor="#e3c15f" />
          </linearGradient>
        </defs>
        <text
          x="220"
          y="158"
          textAnchor="middle"
          fontSize="210"
          fontWeight="400"
          fill="none"
          stroke="url(#nf-gold)"
          strokeWidth="1.5"
          className="nf-draw"
          style={{ fontFamily: 'var(--font-inter), sans-serif' }}
        >
          404
        </text>
      </svg>

      <div className="nf-rise" style={{ animationDelay: '900ms' }}>
        <GlassButton href="/">{t.home}</GlassButton>
      </div>
    </section>
  );
}
