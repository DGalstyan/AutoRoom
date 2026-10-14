import { describe, expect, it } from 'vitest';
import { formatDate } from '@/lib/dateFormat';

describe('formatDate', () => {
  it('writes DD.MM.YYYY', () => {
    expect(formatDate('2026-02-12T00:00:00.000Z')).toBe('12.02.2026');
  });
  it('is empty for nothing or junk', () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate('nope')).toBeNull();
  });
});
