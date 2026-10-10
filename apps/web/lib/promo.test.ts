import { describe, expect, it } from 'vitest';
import {
  ARCHIVE_DAYS,
  formatCountdown,
  isArchived,
  promoPoints,
  promoStatus,
  savings,
} from '@/lib/promo';

const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const at = (offset: number) => new Date(NOW + offset).toISOString();
const LABELS = { days: 'օր', hours: 'ժ', minutes: 'ր', lessThanMinute: '1 ր-ից պակաս' };

describe('promoStatus', () => {
  it('is active well before the deadline', () => {
    expect(promoStatus(at(10 * DAY), NOW)).toBe('active');
  });
  it('is ending-soon inside the last 48 hours', () => {
    expect(promoStatus(at(48 * HOUR), NOW)).toBe('ending-soon');
    expect(promoStatus(at(2 * HOUR), NOW)).toBe('ending-soon');
    expect(promoStatus(at(48 * HOUR + 1000), NOW)).toBe('active');
  });
  it('is expired at the deadline itself and after', () => {
    expect(promoStatus(at(0), NOW)).toBe('expired');
    expect(promoStatus(at(-1000), NOW)).toBe('expired');
  });
  it('is null without a (valid) deadline', () => {
    expect(promoStatus(null, NOW)).toBeNull();
    expect(promoStatus('not a date', NOW)).toBeNull();
  });
});

describe('isArchived', () => {
  it('drops a promotion from the list only after the archive window', () => {
    expect(isArchived(at(-(ARCHIVE_DAYS - 1) * DAY), NOW)).toBe(false);
    expect(isArchived(at(-(ARCHIVE_DAYS + 1) * DAY), NOW)).toBe(true);
  });
});

describe('formatCountdown (Armenian units)', () => {
  it('shows days, hours and minutes', () => {
    expect(formatCountdown(at(12 * DAY + 3 * HOUR + 5 * 60_000), LABELS, NOW)).toBe(
      '12 օր 3 ժ 5 ր',
    );
  });
  it('keeps hours once there are days, even when the hour is 0', () => {
    expect(formatCountdown(at(2 * DAY + 7 * 60_000), LABELS, NOW)).toBe('2 օր 0 ժ 7 ր');
  });
  it('drops leading zero units', () => {
    expect(formatCountdown(at(3 * HOUR + 5 * 60_000), LABELS, NOW)).toBe('3 ժ 5 ր');
    expect(formatCountdown(at(5 * 60_000), LABELS, NOW)).toBe('5 ր');
  });
  it('never reads 0 while the promotion is still on', () => {
    expect(formatCountdown(at(30_000), LABELS, NOW)).toBe('1 ր-ից պակաս');
  });
  it('is empty once expired', () => {
    expect(formatCountdown(at(-1), LABELS, NOW)).toBe('');
  });
  it('contains no Latin d/h/m units', () => {
    expect(formatCountdown(at(12 * DAY + 3 * HOUR + 5 * 60_000), LABELS, NOW)).not.toMatch(
      /\d[dhm]\b/,
    );
  });
});

describe('savings', () => {
  it('amount and rounded percent against the old price', () => {
    expect(savings(45_000, 50_000)).toEqual({ amount: 5_000, percent: 10 });
  });
  it('null when there is no discount', () => {
    expect(savings(50_000, 50_000)).toBeNull();
    expect(savings(50_000, null)).toBeNull();
  });
});

describe('promoPoints', () => {
  const fallback = ['default'];
  it('splits the admin text into one point per non-empty line', () => {
    expect(promoPoints({ hy: ' ա \n\n բ ' }, 'hy', fallback)).toEqual(['ա', 'բ']);
  });
  it("uses the visitor's language, falling back to Armenian then to the default wording", () => {
    expect(promoPoints({ hy: 'ա', en: 'a' }, 'en', fallback)).toEqual(['a']);
    expect(promoPoints({ hy: 'ա' }, 'ru', fallback)).toEqual(['ա']);
    expect(promoPoints(null, 'hy', fallback)).toEqual(fallback);
    expect(promoPoints({ hy: '   ' }, 'hy', fallback)).toEqual(fallback);
  });
});
