/**
 * Homepage hero — Figma `Homepage` (436:1891), 0–942px:
 *  - the animated desert clip (the Figma GIF, supplied as a ~230 KB looping MP4 over
 *    an instant poster), 1448×814 at (-7,-2);
 *  - a 21px backdrop-blur scrim at 50% black over the top 838px;
 *  - a 5px-blurred tan→white fade (rgb(107,93,78) → rgb(250,250,250)) over the
 *    last 309px, so the stats read as part of the page rather than a hard cut;
 *  - the 36px/56px headline at y=203 and the three stats at y=699.
 * Below `lg` the same layers stack in normal flow instead of absolute offsets.
 */
export function HomeHero({ h1, stats }: { h1: string; stats: { value: string; label: string }[] }) {
  return (
    <section className="relative isolate overflow-x-clip pb-16 pt-[132px] lg:h-[854px] lg:pb-0 lg:pt-0">
      {/* The clip is letterboxed (black bars top and bottom), so it is scaled up to crop them.
          Reduced-motion visitors get the still poster instead of an autoplaying video. */}
      <div className="absolute inset-x-0 -top-[2px] -z-10 h-[calc(100%-120px)] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_calc(100%-72px),transparent)] lg:h-[600px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/home/v2/hero-poster.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <video
          src="/videos/home-hero.mp4"
          poster="/images/home/v2/hero-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-[1.42] object-cover motion-reduce:hidden"
        />
      </div>
      {/* Figma `Rectangle 34624690` (471:3049): the 187px tan→page-grey fade, 8.5px blurred,
          x −10…1450 so the blur never shows a hard edge. */}
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-[46%] bg-[length:100%_100%] blur-[8.5px] lg:-inset-x-[10px] lg:top-[536px] lg:h-[187px]"
        style={{ backgroundImage: 'url(/images/home/v2/hero-fade.png)' }}
        aria-hidden="true"
      />

      {/* The fade-up keyframes animate `transform`, which would clobber the centering
          translate — so positioning lives on a wrapper and only the inner element animates. */}
      <div className="lg:absolute lg:left-1/2 lg:top-[426px] lg:w-[min(1148px,calc(100%-48px))] lg:-translate-x-1/2">
        <h1 className="mx-auto max-w-[1148px] animate-fade-up px-4 text-center uppercase stretch-85 text-[26px] font-semibold leading-[36px] text-neutral-50 motion-reduce:animate-none sm:text-[32px] sm:leading-[44px] lg:px-0 lg:text-[36px] lg:leading-[56px]">
          {h1.split(/(\S+-\S+)/).map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className="whitespace-nowrap">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </h1>
      </div>

      <div className="mt-24 sm:mt-40 lg:absolute lg:left-1/2 lg:top-[619px] lg:mt-0 lg:w-full lg:max-w-[1344px] lg:-translate-x-1/2 min-[1400px]:w-max">
        <div className="mx-auto grid max-w-[1190px] animate-fade-up grid-cols-1 gap-8 px-4 text-center [animation-delay:150ms] motion-reduce:animate-none sm:grid-cols-3 sm:gap-6 lg:max-w-none lg:gap-8 lg:px-12 min-[1400px]:flex min-[1400px]:justify-center min-[1400px]:gap-16 min-[1400px]:px-0">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={i === 0 ? 'min-[1400px]:w-auto' : 'min-[1400px]:w-[354px]'}
            >
              <p className="text-[36px] font-bold leading-[44px] text-ink lg:text-[48px] lg:leading-[56px]">
                {stat.value}
              </p>
              <p className="mt-1.5 stretch-93 text-[16px] font-bold leading-6 text-ink sm:text-[18px] min-[1400px]:whitespace-nowrap lg:text-[20px] lg:leading-8">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
