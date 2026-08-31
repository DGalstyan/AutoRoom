/**
 * `interpolate('Hi {name}', { name: 'Ani' })` → `'Hi Ani'`. Locale-independent,
 * so it stays a plain function here rather than moving into `lib/i18n.ts`.
 *
 * The message tree itself is NOT exported statically from this file anymore —
 * that used to be `export const messages = hy`, which froze every request to
 * whichever locale's JSON happened to load first. Read it per request
 * instead: `getServerMessages()` (`lib/i18n.ts`) in a Server Component,
 * `useMessages()` (`components/shared/LocaleProvider.tsx`) in a Client
 * Component.
 */
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
