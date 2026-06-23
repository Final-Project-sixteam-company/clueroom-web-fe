// Pure, framework-agnostic single-flight + generation-guard controller for
// access-token refresh. Extracted verbatim-in-behavior from App.tsx so the
// regression-critical invariants (single-flight, generation guard) are
// unit-testable without React. See src/auth/refreshController.test.ts.
//
// Invariants preserved from the original inline implementation:
// - single-flight: concurrent refresh() calls share ONE in-flight promise.
// - generation guard (success): if the generation changed while the refresh
//   was in flight (session replaced / logged out), the result is stale -> do
//   NOT persist it (would clobber the newer session).
// - generation guard (failure): only clear local tokens if the generation is
//   unchanged; a newer session must survive a stale refresh failure.
// - the in-flight slot is cleared only if it is still the current promise.

export type RefreshHandlers<T> = {
  /** Performs the network refresh; resolves with the new token payload or throws. */
  fetchTokens: () => Promise<T>;
  /** Extracts the access-token string from the payload. */
  extractToken: (payload: T) => string;
  /** Persists the new tokens. Called only when the generation is unchanged. */
  persist: (payload: T) => Promise<void> | void;
  /** Clears local tokens after a failed refresh. Called only when generation is unchanged. */
  clearOnFailure: () => Promise<void> | void;
};

export type RefreshController = {
  /** Current generation. Read to capture/compare for out-of-band guarded flows (e.g. bootstrap). */
  readonly generation: number;
  /** Bump generation and stop sharing any stale in-flight refresh (e.g. session replaced). */
  bumpGeneration: () => void;
  /** Bump generation AND drop the in-flight refresh (e.g. logout). */
  reset: () => void;
  /** Single-flight, generation-guarded refresh. Returns the new access token, or null. */
  refresh: <T>(handlers: RefreshHandlers<T>) => Promise<string | null>;
};

export function createRefreshController(): RefreshController {
  let generation = 0;
  let inFlight: Promise<string | null> | null = null;
  // Identity of the current in-flight refresh. Used so a stale flight settling
  // after reset()/a newer flight cannot null out a newer in-flight slot.
  let inFlightId = 0;

  function refresh<T>(handlers: RefreshHandlers<T>): Promise<string | null> {
    if (inFlight) return inFlight;

    const startGeneration = generation;
    const flightId = ++inFlightId;
    const promise: Promise<string | null> = (async () => {
      try {
        const payload = await handlers.fetchTokens();
        if (startGeneration !== generation) return null; // superseded -> don't persist
        await handlers.persist(payload);
        return handlers.extractToken(payload);
      } catch {
        if (startGeneration === generation) await handlers.clearOnFailure();
        return null;
      } finally {
        if (inFlightId === flightId) inFlight = null;
      }
    })();

    inFlight = promise;
    return promise;
  }

  return {
    get generation() {
      return generation;
    },
    bumpGeneration() {
      generation += 1;
      inFlight = null;
    },
    reset() {
      generation += 1;
      inFlight = null;
    },
    refresh,
  };
}
