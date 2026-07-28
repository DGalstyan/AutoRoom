/**
 * Financing partners for the `BuyWithLoan` grid (China + USA-available car
 * details and the China financing section).
 *
 * The three partner banks leave the site — their tiles open the bank's own
 * online auto-loan application in a new tab. The AutoRoom tile does not: it
 * opens our in-house offer in place.
 */

export interface Bank {
  id: string;
  /** Wordmark shown until a logo asset is delivered. */
  name: string;
  /** TODO(client): supply logo files, then set the path here. */
  logo?: string;
  /**
   * Bank's online auto-loan application.
   * TODO(client): confirm the exact application deep links — these are the
   * banks' own domains, not verified campaign URLs.
   */
  url?: string;
  /** AutoRoom's own financing — opens a dialog instead of navigating away. */
  inHouse?: boolean;
}

export const BANKS: Bank[] = [
  { id: 'ameriabank', name: 'Ameriabank', url: 'https://ameriabank.am' },
  { id: 'evoca', name: 'Evoca', url: 'https://evoca.am' },
  { id: 'idbank', name: 'IDBank', url: 'https://idbank.am' },
  { id: 'autoroom', name: 'AutoRoom', inHouse: true },
];
