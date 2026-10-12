/**
 * Makes a send impossible to freeze on. A Server Action call from the browser can reject (offline,
 * dropped connection, 5xx) or simply never answer on a bad network; either left the forms on
 * "Sending…" for good with nothing handling the error. `settle` always resolves: the action's own
 * result, or `{ ok: false, failure }` after `ms` or on any thrown error, so the caller can show an
 * error and let the visitor retry.
 */
export const SEND_TIMEOUT_MS = 20_000;

export type SendFailure = { ok: false; failure: 'timeout' | 'network' };

export async function settle<T extends { ok: boolean }>(
  promise: Promise<T>,
  ms: number = SEND_TIMEOUT_MS,
): Promise<T | SendFailure> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<SendFailure>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, failure: 'timeout' }), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } catch {
    return { ok: false, failure: 'network' };
  } finally {
    clearTimeout(timer);
  }
}
