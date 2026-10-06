/**
 * Messenger deep links — pure, dependency-free, shared by the API (validation
 * on save, links in `/settings/public`) and the admin (live preview), so a link
 * the admin sees is exactly the link visitors get.
 *
 * "Verified" here means: the admin's input is parsed strictly, normalised to a
 * canonical handle, and rejected with a clear message when it cannot form a
 * working deep link. Nothing malformed is ever stored or published. (Whether
 * the number actually has the app installed is for the admin to confirm with
 * the preview's "Test link" button.)
 *
 *   WhatsApp  https://wa.me/<digits>                (supports ?text= prefill)
 *   Viber     viber://chat?number=%2B<digits>
 *   Telegram  https://t.me/<username>
 */

export type Messenger = 'whatsapp' | 'viber' | 'telegram';

export interface MessengerHandles {
  whatsapp: string | null;
  viber: string | null;
  telegram: string | null;
}

export type MessengerLinks = MessengerHandles;

export type ParseResult = { ok: true; value: string } | { ok: false; message: string };

const ARMENIA_CC = '374';

/** Digits of an international phone number, or an error. Accepts `+374 93 88 28 18`, `0037493882818`, local `093 88 28 18` and wa.me / api.whatsapp.com links. */
export function parsePhone(input: string): ParseResult {
  let raw = input.trim();

  const linkMatch = raw.match(
    /^(?:https?:\/\/)?(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?(?:.*&)?phone=)(\+?[\d%B ]+)/i,
  );
  if (linkMatch?.[1]) raw = decodeURIComponent(linkMatch[1]);

  if (/[A-Za-z]/.test(raw.replace(/%2B/gi, ''))) {
    return { ok: false, message: 'Enter a phone number with country code, e.g. +374 93 88 28 18' };
  }

  let digits = raw.replace(/[\s\-().+]/g, '');
  if (!/^\d+$/.test(digits)) {
    return { ok: false, message: 'Use digits only, e.g. +374 93 88 28 18' };
  }
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Armenian local format: 0 + 8 digits.
  else if (digits.length === 9 && digits.startsWith('0')) digits = ARMENIA_CC + digits.slice(1);

  if (digits.length < 8 || digits.length > 15 || digits.startsWith('0')) {
    return {
      ok: false,
      message: 'Enter a full international number (8–15 digits), e.g. +374 93 88 28 18',
    };
  }
  return { ok: true, value: digits };
}

/** Telegram username without `@`. Accepts `@name`, `name`, `t.me/name`, `https://t.me/name`, `telegram.me/name`. */
export function parseTelegram(input: string): ParseResult {
  let raw = input.trim();
  raw = raw.replace(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i, '');
  raw = raw.replace(/^@/, '').replace(/[/?#].*$/, '');

  if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(raw)) {
    return {
      ok: false,
      message:
        'Telegram username: 5–32 letters, digits or underscores, starting with a letter (e.g. @autoroom_am)',
    };
  }
  return { ok: true, value: raw };
}

export function parseMessenger(messenger: Messenger, input: string): ParseResult {
  return messenger === 'telegram' ? parseTelegram(input) : parsePhone(input);
}

export function buildMessengerLink(messenger: Messenger, handle: string | null): string | null {
  if (!handle) return null;
  switch (messenger) {
    case 'whatsapp':
      return `https://wa.me/${handle}`;
    case 'viber':
      return `viber://chat?number=%2B${handle}`;
    case 'telegram':
      return `https://t.me/${handle}`;
  }
}

export function buildMessengerLinks(handles: MessengerHandles): MessengerLinks {
  return {
    whatsapp: buildMessengerLink('whatsapp', handles.whatsapp),
    viber: buildMessengerLink('viber', handles.viber),
    telegram: buildMessengerLink('telegram', handles.telegram),
  };
}

/** `https://wa.me/<n>?text=…` — WhatsApp is the only one of the three that reliably honours prefilled text. */
export function withPrefilledText(messenger: Messenger, link: string, text: string): string {
  if (messenger !== 'whatsapp' || !text) return link;
  return `${link}?text=${encodeURIComponent(text)}`;
}
