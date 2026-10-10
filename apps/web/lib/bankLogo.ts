/**
 * The logo to show for a partner bank: the one uploaded in the admin when there is one, otherwise
 * the bundled mark of the three partner banks (matched by name) or AutoRoom's own mark for the
 * in-house row. Returns `null` only for an unknown bank with no upload, which then shows its name.
 */
import type { Bank } from '@/lib/banks';

const BUNDLED: { match: RegExp; src: string }[] = [
  { match: /ameria/i, src: '/images/banks/ameriabank.svg' },
  { match: /evoca/i, src: '/images/banks/evoca.png' },
  { match: /\bid\s?bank/i, src: '/images/banks/idbank.png' },
];

export function bankLogoSrc(bank: Pick<Bank, 'name' | 'logoUrl' | 'inHouse'>): string | null {
  if (bank.logoUrl) return bank.logoUrl;
  if (bank.inHouse) return '/brand/logo-mark-dark.svg';
  return BUNDLED.find((entry) => entry.match.test(bank.name))?.src ?? null;
}

/** `banks` with `logoUrl` filled from `bankLogoSrc`, so renderers need no fallback logic of their own. */
export function withBankLogos<T extends Pick<Bank, 'name' | 'logoUrl' | 'inHouse'>>(
  banks: T[],
): T[] {
  return banks.map((bank) => ({ ...bank, logoUrl: bankLogoSrc(bank) }));
}
