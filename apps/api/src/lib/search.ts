import type { Prisma } from '@prisma/client';

/**
 * Text search for the admin and public lists.
 *
 * Prisma's `contains` passes the text to a SQL `LIKE` without escaping its wildcards, so a search
 * for `%` or `_` matched every row. `escapeLike` escapes them, and `wordSearch` splits the query
 * into words that must ALL match (any of the given fields each), so "McLaren 720S" finds the car
 * whose make is McLaren and model 720S, instead of looking for that whole phrase in one column.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

/** Up to six words of a search box, whitespace-separated. */
export function searchWords(search: string): string[] {
  return search.split(/\s+/).filter(Boolean).slice(0, 6);
}

/** `{ contains }` for one word, wildcard-safe. */
export function containsWord(word: string) {
  return { contains: escapeLike(word), mode: 'insensitive' as Prisma.QueryMode };
}

/** An `AND` list: each word must match at least one of `fields(word)`. */
export function wordSearch<T>(
  search: string,
  fields: (word: ReturnType<typeof containsWord>) => T[],
) {
  return searchWords(search).map((word) => ({ OR: fields(containsWord(word)) }));
}
