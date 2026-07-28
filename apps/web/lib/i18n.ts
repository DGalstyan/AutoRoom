import hy from '@/messages/hy.json';

/**
 * i18n scaffolding. Every Armenian string lives in `messages/<locale>.json` and is
 * rendered through `t()` — never as an inline literal in a component. Adding a
 * second locale later means adding a file here plus a locale segment in routing.
 */
export const defaultLocale = 'hy' as const;
export type Locale = typeof defaultLocale;

const dictionaries = { hy } as const;

type Dictionary = typeof hy;

/** Dot-paths to every leaf string in the message tree, e.g. `common.cta.getOffer`. */
type LeafPath<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPath<T[K]>}`;
    }[keyof T & string];

export type MessageKey = LeafPath<Dictionary>;

/** Look up a message by dot-path. Missing keys return the key itself (loud in dev). */
export function t(key: MessageKey, locale: Locale = defaultLocale): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
      dictionaries[locale],
    );

  if (typeof value !== 'string') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Missing message for key "${key}" (${locale})`);
    }
    return key;
  }
  return value;
}

/** Interpolate `{name}`-style placeholders: t2('...', { name: 'Անի' }). */
export function tf(key: MessageKey, values: Record<string, string | number>, locale?: Locale) {
  return t(key, locale).replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
