/**
 * Auto `+374` phone mask for `UniversalPopup`'s required phone field.
 * Accepts any digits the user types (with or without a leading 374/0) and
 * always renders `+374 XX XXX XXX`.
 */
export function formatArmenianPhone(rawInput: string): string {
  let digits = rawInput.replace(/\D/g, '');
  if (digits.startsWith('374')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
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
