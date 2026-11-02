/** Upper bound for any single network request made by an environment widget. */
export const FETCH_TIMEOUT_MS = 15_000;

/**
 * Return a `RequestInit` whose signal aborts after `FETCH_TIMEOUT_MS`, so a
 * hung upstream can never leave a 24/7 display waiting forever. Falls back to
 * an AbortController timer on browsers without `AbortSignal.timeout`.
 */
export function withFetchTimeout(init: RequestInit = {}): RequestInit {
  let signal: AbortSignal;
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  } else {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    signal = controller.signal;
  }
  return { ...init, signal };
}
