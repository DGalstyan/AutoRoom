/**
 * Armenian phone handling for every lead form on the site.
 *
 * Numbers are stored as the 8-digit local part only (operator code + subscriber,
 * e.g. `94077757`); the `+374` prefix is chrome the user never edits. That keeps
 * validation trivial and makes the CRM value unambiguous.
 */

export const PHONE_PREFIX = '+374';
export const PHONE_LOCAL_LENGTH = 8;

/**
 * Reduce anything the user types or pastes to the 8 local digits.
 * Handles `+374 94 077757`, `0 94 077757` and `374-94-077757` alike.
 */
export function normalizePhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('374')) digits = digits.slice(3);
  // A leading 0 is the domestic trunk prefix — it is not part of the number.
  while (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, PHONE_LOCAL_LENGTH);
}

/** `94077757` → `94 077757` (the shape used in the branch data and footer). */
export function formatPhoneLocal(digits: string): string {
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} ${digits.slice(2)}`;
}

/** `94077757` → `+37494077757`, the value sent to the CRM and used in `tel:`. */
export function toE164(digits: string): string {
  return `${PHONE_PREFIX}${digits}`.replace(/\s/g, '');
}

export function isValidPhone(digits: string): boolean {
  return digits.length === PHONE_LOCAL_LENGTH;
}
