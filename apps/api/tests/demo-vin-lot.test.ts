import { describe, expect, it } from 'vitest';
import { classifyLot, classifyVin } from '../src/lib/demoVinLot';

describe('classifyVin', () => {
  it.each([
    ['5YJ3E1EA*XF000000', 'known sample VIN'],
    ['1FTFW1E5*NF000000', 'known sample VIN'],
    ['1HGCM82633A*04352', 'masked VIN (contains *)'],
    ['11111111111111111', 'repeated character run'],
    ['LW433B1K5N1000000', 'serial part is all zeros'],
    ['DEMO-VIN-12345', 'placeholder word'],
    ['test', 'placeholder word'],
  ])('flags %s as demo', (vin, reason) => {
    expect(classifyVin(vin)).toEqual({ kind: 'demo', reason });
  });

  it.each(['1HGCM82633A004352', 'LW433B1K5N1000001', '5YJ3E1EA7KF317000', 'WBA3A5C51CF256985'])(
    'leaves the real-looking VIN %s alone',
    (vin) => {
      expect(classifyVin(vin).kind).toBe('ok');
    },
  );

  it('reports a malformed (but not obviously fake) VIN as suspect, never demo', () => {
    expect(classifyVin('ABC123').kind).toBe('suspect');
    expect(classifyVin('1HGCM82633A00435I').kind).toBe('suspect'); // contains I
  });

  it('treats empty / null as ok', () => {
    expect(classifyVin(null).kind).toBe('ok');
    expect(classifyVin('   ').kind).toBe('ok');
  });

  it('honours caller-supplied extra demo values (case-insensitive)', () => {
    expect(classifyVin('abcdefgh12345678j', ['ABCDEFGH12345678J']).kind).toBe('demo');
  });
});

describe('classifyLot', () => {
  it.each(['IAAI-48213077', 'iaai-48213077', '0000000', 'XXXXXXXX', 'TEST-LOT', 'tbd'])(
    'flags %s as demo',
    (lot) => {
      expect(classifyLot(lot).kind).toBe('demo');
    },
  );

  it.each(['58392011', 'IAAI-39481220', '42817593', 'COPART-71234567'])(
    'leaves the real-looking lot %s alone',
    (lot) => {
      expect(classifyLot(lot).kind).toBe('ok');
    },
  );
});
