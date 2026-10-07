/**
 * Footer social/messenger glyphs — white 40px discs with a dark icon (Figma
 * 436:2064/2071). Facebook, TikTok, WhatsApp, Telegram and Instagram come from
 * the design's own vectors; LinkedIn and Viber have none there, so they get a
 * matching minimal glyph.
 */
export type SocialKey =
  'facebook' | 'tiktok' | 'whatsapp' | 'telegram' | 'instagram' | 'linkedin' | 'viber';

const IMG = (name: string, size: number) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={`/images/home/v2/svg/${name}.svg`} alt="" width={size} height={size} />
);

export function SocialIcon({ name }: { name: SocialKey }) {
  switch (name) {
    case 'facebook':
      return IMG('facebook-glyph', 18);
    case 'tiktok':
      return IMG('tiktok-glyph', 18);
    case 'whatsapp':
      return IMG('whatsapp-glyph', 20);
    case 'telegram':
      // The design's Telegram/Instagram assets are complete 40px discs — rendered as such by the caller.
      return null;
    case 'instagram':
      return null;
    case 'linkedin':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0D0D0D" aria-hidden="true">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.83v1.54h.06c.53-.95 1.84-1.95 3.79-1.95 4.05 0 4.8 2.57 4.8 5.91V21h-4v-5.07c0-1.21-.02-2.77-1.8-2.77-1.8 0-2.07 1.3-2.07 2.68V21h-4V9.75Z" />
        </svg>
      );
    case 'viber':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0D0D0D" aria-hidden="true">
          <path d="M12.1 2C7.2 2 3.5 3 2.6 7.3c-.6 2.9-.5 6.3.7 8.6.6 1.2 1.7 2 2.7 2.4V22l3.1-2.8c.9.1 1.8.1 3 .1 4.9 0 8.6-1 9.5-5.3.6-2.9.5-6.3-.7-8.6C19.5 3.4 16.3 2 12.1 2Zm.2 2.2c3.4 0 5.9 1 7 3.1 1 1.9 1 4.9.5 7.2-.7 3.2-3.5 3.8-7.6 3.8-1.4 0-2.4 0-3.3-.2l-1.9 1.7v-2.2c-.8-.3-1.7-.9-2.2-1.9-.9-1.8-1-4.6-.5-7C4.8 5.4 6.9 4.2 12.3 4.2Zm-.7 2c-.2 0-.3.1-.3.3 0 .2.1.3.3.3 2 0 3.6 1.6 3.6 3.6 0 .2.1.3.3.3.2 0 .3-.1.3-.3 0-2.3-1.8-4.2-4.2-4.2Zm-3 .8c-.3 0-.9.3-1.2.7-.4.5-.5 1-.2 1.8.7 2.1 2 3.9 3.8 5.2 1 .7 2.3 1.4 3 1.5.6.1 1.4-.2 1.7-.9.2-.4.1-.8-.2-1.1-.4-.4-1.2-1-1.7-1.3-.4-.2-.8-.1-1 .2l-.4.5c-.1.1-.3.2-.5.1-.9-.4-2-1.7-2.5-2.5-.1-.2-.1-.3.1-.5l.4-.4c.3-.3.4-.7.2-1l-1-1.6c-.1-.4-.3-.7-.5-.7Zm3.4.2c-.2 0-.3.1-.3.3 0 .2.1.3.3.3 1.1 0 1.9.8 1.9 1.9 0 .2.1.3.3.3.2 0 .3-.1.3-.3 0-1.4-1.1-2.5-2.5-2.5Zm0 1.2c-.2 0-.3.1-.3.3 0 .2.1.3.3.3.4 0 .7.3.7.7 0 .2.1.3.3.3.2 0 .3-.1.3-.3 0-.8-.7-1.3-1.3-1.3Z" />
        </svg>
      );
  }
}

/** Telegram and Instagram arrive from the design as full 40px discs. */
export function SocialDisc({ name }: { name: SocialKey }) {
  if (name === 'telegram' || name === 'instagram') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/images/home/v2/svg/${name}.svg`}
        alt=""
        width={40}
        height={40}
        className="size-10"
      />
    );
  }
  return (
    <span className="flex size-10 items-center justify-center rounded-full bg-white">
      <SocialIcon name={name} />
    </span>
  );
}
