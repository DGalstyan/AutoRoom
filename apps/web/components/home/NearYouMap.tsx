import Image from 'next/image';

/**
 * "Միշտ քո կողքին" — Figma 485:5134 (Map, 1440×961). A black full-bleed block: the 44px light white heading, then
 * the flat 1178×711 dotted world map with gold arcs from the «Հայաստան» pin, 64px below it and 64px above the
 * bottom edge. No branch list or button — the design has only the map. The artwork is Figma's own export of the
 * `World Map` frame (485:5139).
 */
export function NearYouMap({ heading }: { heading: string }) {
  return (
    <section className="bg-black text-white">
      <div className="mx-auto flex max-w-page flex-col items-center gap-10 px-4 py-12 sm:px-6 lg:gap-16 lg:px-12 lg:py-16">
        <h2 className="type-h2 text-center">{heading}</h2>
        <Image
          src="/images/home/v2/world-map.webp"
          alt=""
          width={1178}
          height={712}
          sizes="(min-width: 1280px) 1178px, 100vw"
          className="h-auto w-full max-w-[1178px]"
        />
      </div>
    </section>
  );
}
