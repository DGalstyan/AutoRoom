/**
 * Auto `+374` phone mask for the lead forms' phone field. Renders `+374 XX XXX XXX` from whatever
 * the visitor types or pastes: local digits with or without a leading 0, or the full number in any
 * of the usual forms (`+374 94 123456`, `37494123456`, `00374…`, `+374 094…`).
 *
 * The field is always showing its own `+374 ` prefix, so the raw value is that prefix plus what
 * was typed. The prefix is removed first — otherwise the `374` of a full number typed key by key
 * (or pasted after the prefix) would be read as the first local digits ("+374 37 494 123").
 */
export function formatArmenianPhone(rawInput: string): string {
  const compact = rawInput.replace(/\s/g, '');
  // Only the start of the prefix is left (a visitor backspacing or starting to type "+374"):
  // that is an empty number, not "37".
  if (compact.startsWith('+') && '+374'.startsWith(compact)) return '+374 ';

  const ownPrefix = /^\+374 /;
  let digits = (ownPrefix.test(rawInput) ? rawInput.replace(ownPrefix, '') : rawInput).replace(
    /\D/g,
    '',
  );
  if (digits.startsWith('00374')) digits = digits.slice(5);
  else if (digits.startsWith('374')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 8);

  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)].filter(Boolean);
  return parts.length ? `+374 ${parts.join(' ')}` : '+374 ';
}

export function isValidArmenianPhone(formatted: string): boolean {
  const digits = formatted.replace(/\D/g, '').replace(/^374/, '');
  return digits.length === 8;
}

export function phoneDigitsToTel(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  return `+${digits.startsWith('374') ? digits : `374${digits}`}`;
}
