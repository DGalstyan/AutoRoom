import hy from '@/messages/hy.json';

/**
 * Single import point for the Armenian copy. Components read
 * `messages.common.*` / `messages.home.*` instead of inlining literals, per
 * the skill's i18n scaffolding rule — this is the seam a second locale would
 * plug into later.
 */
export const messages = hy;

/** `interpolate('Hi {name}', { name: 'Ani' })` → `'Hi Ani'`. */
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
