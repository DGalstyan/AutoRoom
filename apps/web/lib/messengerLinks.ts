/**
 * Prefill helper for the lead popups' "continue in <messenger>" button.
 * WhatsApp is the only one of the three whose deep link reliably honours a
 * prefilled message (`?text=`); Viber and Telegram links open the chat as-is.
 * (The link *building* and validation live in the API — this only decorates an
 * already-verified link.)
 */
export type MessengerKey = 'whatsapp' | 'viber' | 'telegram';

export function withPrefilledText(messenger: MessengerKey, link: string, text: string): string {
  if (messenger !== 'whatsapp' || !text) return link;
  return `${link}?text=${encodeURIComponent(text)}`;
}
