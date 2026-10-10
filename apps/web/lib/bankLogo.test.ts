import { describe, expect, it } from 'vitest';
import { bankLogoSrc } from '@/lib/bankLogo';

const bank = (name: string, extra = {}) => ({ name, logoUrl: null, inHouse: false, ...extra });

describe('bankLogoSrc', () => {
  it('prefers the logo uploaded in the admin', () => {
    expect(bankLogoSrc(bank('Ameriabank', { logoUrl: 'https://x/y.png' }))).toBe('https://x/y.png');
  });
  it('falls back to the bundled marks of the partner banks, by name', () => {
    expect(bankLogoSrc(bank('Ameriabank'))).toBe('/images/banks/ameriabank.svg');
    expect(bankLogoSrc(bank('Evoca'))).toBe('/images/banks/evoca.png');
    expect(bankLogoSrc(bank('IDBank'))).toBe('/images/banks/idbank.png');
    expect(bankLogoSrc(bank('ID Bank'))).toBe('/images/banks/idbank.png');
  });
  it('uses the AutoRoom mark for the in-house row', () => {
    expect(bankLogoSrc(bank('AutoRoom', { inHouse: true }))).toBe('/brand/logo-mark-dark.svg');
  });
  it('is null for an unknown bank with no upload (the name is shown instead)', () => {
    expect(bankLogoSrc(bank('Some Other Bank'))).toBeNull();
  });
});
