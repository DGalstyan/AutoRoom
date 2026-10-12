import { afterEach, describe, expect, it, vi } from 'vitest';
import { settle } from '@/lib/settle';

afterEach(() => vi.useRealTimers());

describe('settle', () => {
  it('passes the result through when the send answers', async () => {
    expect(await settle(Promise.resolve({ ok: true }))).toEqual({ ok: true });
    expect(await settle(Promise.resolve({ ok: false, reason: 'conflict' }))).toEqual({
      ok: false,
      reason: 'conflict',
    });
  });
  it('turns a rejected send (offline, dropped connection, 5xx) into a failure instead of throwing', async () => {
    expect(await settle(Promise.reject(new Error('Failed to fetch')))).toEqual({
      ok: false,
      failure: 'network',
    });
  });
  it('gives up on a send that never answers, after the timeout', async () => {
    vi.useFakeTimers();
    const pending = settle(new Promise<{ ok: boolean }>(() => {}), 5_000);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await pending).toEqual({ ok: false, failure: 'timeout' });
  });
  it('does not time out a send that answers in time', async () => {
    vi.useFakeTimers();
    const pending = settle(
      new Promise<{ ok: boolean }>((resolve) => setTimeout(() => resolve({ ok: true }), 1_000)),
      5_000,
    );
    await vi.advanceTimersByTimeAsync(1_000);
    expect(await pending).toEqual({ ok: true });
  });
});
