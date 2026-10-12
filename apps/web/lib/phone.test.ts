import { describe, expect, it } from 'vitest';
import { formatArmenianPhone, isValidArmenianPhone } from '@/lib/phone';

/** What the field does on every keystroke: feed the new raw value back through the mask. */
function typeInto(initial: string, text: string): string {
  let value = initial;
  for (const char of text) value = formatArmenianPhone(value + char);
  return value;
}

describe('formatArmenianPhone — local numbers', () => {
  it('formats local digits with or without the leading 0', () => {
    expect(formatArmenianPhone('94123456')).toBe('+374 94 123 456');
    expect(formatArmenianPhone('094123456')).toBe('+374 94 123 456');
  });
  it('is empty-but-prefixed for no digits', () => {
    expect(formatArmenianPhone('')).toBe('+374 ');
    expect(formatArmenianPhone('+374 ')).toBe('+374 ');
  });
  it('keeps at most eight local digits', () => {
    expect(formatArmenianPhone('941234567890')).toBe('+374 94 123 456');
  });
  it('typing local digits into the prefilled field works, with or without 0', () => {
    expect(typeInto('+374 ', '94123456')).toBe('+374 94 123 456');
    expect(typeInto('+374 ', '094123456')).toBe('+374 94 123 456');
  });
});

describe('formatArmenianPhone — full numbers (the 374 is not local digits)', () => {
  const EXPECTED = '+374 94 123 456';

  it('pasting the whole number replaces the field', () => {
    expect(formatArmenianPhone('+374 94 123456789')).toBe(EXPECTED);
    expect(formatArmenianPhone('+37494123456')).toBe(EXPECTED);
    expect(formatArmenianPhone('37494123456')).toBe(EXPECTED);
    expect(formatArmenianPhone('00374 94 123456')).toBe(EXPECTED);
  });
  it('pasting the whole number after the field’s own prefix', () => {
    expect(formatArmenianPhone('+374 +374 94 123456789')).toBe(EXPECTED);
    expect(formatArmenianPhone('+374 374 94 123456')).toBe(EXPECTED);
    expect(formatArmenianPhone('+374 094123456')).toBe(EXPECTED);
  });
  it('typing the whole number key by key into the prefilled field (the reported bug)', () => {
    expect(typeInto('+374 ', '+374 94 123456789')).toBe(EXPECTED);
    expect(typeInto('+374 ', '374 94 123456')).toBe(EXPECTED);
  });
  it('typing the whole number after clearing the field', () => {
    expect(typeInto('', '+374 94 123456')).toBe(EXPECTED);
    expect(typeInto('', '+374 94 123456789')).toBe(EXPECTED);
  });
  it('a 0 after the country code is dropped', () => {
    expect(typeInto('', '+374 094123456')).toBe(EXPECTED);
  });
});

describe('formatArmenianPhone — editing', () => {
  it('starting to type or backspacing through the prefix is an empty number, not "37"', () => {
    expect(formatArmenianPhone('+')).toBe('+374 ');
    expect(formatArmenianPhone('+3')).toBe('+374 ');
    expect(formatArmenianPhone('+37')).toBe('+374 ');
    expect(formatArmenianPhone('+374')).toBe('+374 ');
  });
  it('backspacing a typed number keeps it formatted', () => {
    expect(formatArmenianPhone('+374 94 123 45')).toBe('+374 94 123 45');
    expect(formatArmenianPhone('+374 94 123 4')).toBe('+374 94 123 4');
  });
});

describe('isValidArmenianPhone', () => {
  it('needs all eight local digits', () => {
    expect(isValidArmenianPhone('+374 94 123 456')).toBe(true);
    expect(isValidArmenianPhone('+374 94 123 45')).toBe(false);
    expect(isValidArmenianPhone('+374 ')).toBe(false);
  });
});
