// Pure, framework- and transport-agnostic "authenticated request with a single
// 401 -> refresh -> retry" helper. Extracted from App.tsx's authedRequest /
// optionalAuthRequest so the retry/refresh handshake is unit-testable without
// React or a fetch mock (every dependency is injected). See withAuthRetry.test.ts.
//
// Semantics preserved 1:1 with the original inline implementations:
// - resolve a token; if absent, onMissingToken() decides (throw vs anonymous send).
// - send(token); on an "unauthorized" failure, refresh() exactly once.
//   - if refresh yields a token, retry send(newToken).
//   - otherwise onRefreshExhausted(originalError) decides (throw vs anonymous send).
// - any non-unauthorized error propagates untouched (no refresh).

export type WithAuthRetryOptions<T> = {
  /** Resolves the current access token, or null when none is available. */
  getToken: () => Promise<string | null>;
  /** Performs the request with the given bearer token. */
  send: (token: string) => Promise<T>;
  /** Refreshes the session once; resolves with a new token, or null on failure. */
  refresh: () => Promise<string | null>;
  /** True when an error means "unauthorized" and a refresh should be attempted. */
  isUnauthorized: (error: unknown) => boolean;
  /** Invoked when no token is available. May throw (required) or send anonymously (optional). */
  onMissingToken: () => Promise<T>;
  /** Invoked when a refresh after 401 did not yield a token. May throw or send anonymously. */
  onRefreshExhausted: (originalError: unknown) => Promise<T>;
};

export async function withAuthRetry<T>(
  options: WithAuthRetryOptions<T>,
): Promise<T> {
  const token = await options.getToken();
  if (!token) return options.onMissingToken();

  try {
    return await options.send(token);
  } catch (error) {
    if (!options.isUnauthorized(error)) throw error;
    const refreshed = await options.refresh();
    if (refreshed) return options.send(refreshed);
    return options.onRefreshExhausted(error);
  }
}
