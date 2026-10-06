import { describe, expect, it } from 'vitest';
import { isValidLeadName, isValidLeadPhone } from '@/lib/leadValidation';

describe('lead validation (mirrors the API)', () => {
  it.each(['Anna', 'Պողոս Պողոսյան', 'Иван', "O'Brien", ' Li '])('accepts name %j', (n) => {
    expect(isValidLeadName(n)).toBe(true);
  });
  it.each(['', '   ', '12345', '---', '!!!'])('rejects name %j', (n) => {
    expect(isValidLeadName(n)).toBe(false);
  });
  it('requires a complete Armenian phone', () => {
    expect(isValidLeadPhone('+374 77 123 456')).toBe(true);
    expect(isValidLeadPhone('+374 ')).toBe(false);
    expect(isValidLeadPhone('+374 77 12')).toBe(false);
  });
});
