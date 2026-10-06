import type { MessengerLinks } from '@/lib/contacts';

const MESSENGER_NAMES: { key: keyof MessengerLinks; name: string }[] = [
  { key: 'whatsapp', name: 'WhatsApp' },
  { key: 'viber', name: 'Viber' },
  { key: 'telegram', name: 'Telegram' },
];

/** The configured messengers as `{ key, name, href }` — unconfigured ones are omitted, never rendered as dead links. */
export function configuredMessengers(links: MessengerLinks) {
  return MESSENGER_NAMES.filter(({ key }) => links[key]).map(({ key, name }) => ({
    key,
    name,
    href: links[key]!,
  }));
}
