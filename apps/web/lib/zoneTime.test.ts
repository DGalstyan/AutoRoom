import { describe, expect, it } from 'vitest';
import { dstStatus, hoursAhead, utcOffsetMinutes } from '@/lib/zoneTime';

const WINTER = new Date('2026-01-15T12:00:00Z');
const SUMMER = new Date('2026-07-15T12:00:00Z');

describe('utcOffsetMinutes', () => {
  it('Yerevan is UTC+4 all year', () => {
    expect(utcOffsetMinutes('Asia/Yerevan', WINTER)).toBe(240);
    expect(utcOffsetMinutes('Asia/Yerevan', SUMMER)).toBe(240);
  });
  it('Los Angeles shifts by an hour between winter and summer', () => {
    expect(utcOffsetMinutes('America/Los_Angeles', WINTER)).toBe(-480);
    expect(utcOffsetMinutes('America/Los_Angeles', SUMMER)).toBe(-420);
  });
  it('ignores milliseconds in the instant', () => {
    expect(utcOffsetMinutes('America/New_York', new Date('2026-07-15T12:00:00.750Z'))).toBe(-240);
  });
});

describe('dstStatus', () => {
  it('New York is on standard time in January and daylight time in July', () => {
    expect(dstStatus('America/New_York', WINTER)).toBe('standard');
    expect(dstStatus('America/New_York', SUMMER)).toBe('dst');
  });
  it('flips exactly at the 2026 changeovers (Mar 8 and Nov 1, 2am local)', () => {
    expect(dstStatus('America/Chicago', new Date('2026-03-08T07:59:00Z'))).toBe('standard');
    expect(dstStatus('America/Chicago', new Date('2026-03-08T08:01:00Z'))).toBe('dst');
    expect(dstStatus('America/Chicago', new Date('2026-11-01T06:59:00Z'))).toBe('dst');
    expect(dstStatus('America/Chicago', new Date('2026-11-01T07:01:00Z'))).toBe('standard');
  });
  it('Arizona, Hawaii and Yerevan never observe DST', () => {
    for (const zone of ['America/Phoenix', 'Pacific/Honolulu', 'Asia/Yerevan']) {
      expect(dstStatus(zone, WINTER)).toBe('none');
      expect(dstStatus(zone, SUMMER)).toBe('none');
    }
  });
});

describe('hoursAhead', () => {
  it('the gap to Los Angeles is −12 h in winter and −11 h in summer', () => {
    expect(hoursAhead('America/Los_Angeles', 'Asia/Yerevan', WINTER)).toBe(-12);
    expect(hoursAhead('America/Los_Angeles', 'Asia/Yerevan', SUMMER)).toBe(-11);
  });
  it('Arizona matches Los Angeles in summer but not winter', () => {
    expect(hoursAhead('America/Phoenix', 'America/Los_Angeles', SUMMER)).toBe(0);
    expect(hoursAhead('America/Phoenix', 'America/Los_Angeles', WINTER)).toBe(1);
  });
});
