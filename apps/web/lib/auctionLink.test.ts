import { describe, expect, it } from 'vitest';
import { auctionViewLink } from '@/lib/auctionLink';

describe('auctionViewLink', () => {
  it('prefers the View-Only link staff entered', () => {
    expect(
      auctionViewLink({
        auctionViewUrl: 'https://www.copart.com/lot/99999999',
        auctionPlatform: 'COPART',
        lotNumber: '12345678',
      }),
    ).toBe('https://www.copart.com/lot/99999999');
  });
  it('builds a Copart lot link from the lot number', () => {
    expect(
      auctionViewLink({ auctionViewUrl: null, auctionPlatform: 'COPART', lotNumber: '12345678' }),
    ).toBe('https://www.copart.com/lot/12345678');
  });
  it('builds an IAAI vehicle link from the lot number', () => {
    expect(
      auctionViewLink({ auctionViewUrl: null, auctionPlatform: 'IAAI', lotNumber: '40123456' }),
    ).toBe('https://www.iaai.com/VehicleDetail/40123456~US');
  });
  it('keeps only digits of a lot number typed as "Lot # 123-45"', () => {
    expect(
      auctionViewLink({ auctionViewUrl: '', auctionPlatform: 'COPART', lotNumber: 'Lot # 123-45' }),
    ).toBe('https://www.copart.com/lot/12345');
  });
  it('falls back to the platform site without a lot number, never a dead end', () => {
    expect(
      auctionViewLink({ auctionViewUrl: null, auctionPlatform: 'COPART', lotNumber: null }),
    ).toBe('https://www.copart.com/');
    expect(auctionViewLink({ auctionViewUrl: null, auctionPlatform: 'IAAI', lotNumber: '' })).toBe(
      'https://www.iaai.com/',
    );
  });
  it('gives Manheim and unknown platforms no link', () => {
    expect(
      auctionViewLink({ auctionViewUrl: null, auctionPlatform: 'MANHEIM', lotNumber: '1' }),
    ).toBeNull();
    expect(
      auctionViewLink({ auctionViewUrl: null, auctionPlatform: null, lotNumber: '1' }),
    ).toBeNull();
  });
  it('rejects non-http(s) admin values such as javascript:', () => {
    expect(
      auctionViewLink({
        auctionViewUrl: 'javascript:alert(1)',
        auctionPlatform: 'COPART',
        lotNumber: '12345678',
      }),
    ).toBe('https://www.copart.com/lot/12345678');
    expect(
      auctionViewLink({
        auctionViewUrl: 'javascript:alert(1)',
        auctionPlatform: null,
        lotNumber: null,
      }),
    ).toBeNull();
  });
});
