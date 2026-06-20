import { test } from "node:test";
import assert from "node:assert/strict";
import { withAuthRetry } from "./withAuthRetry.ts";

// Stand-in for ApiError so the test stays dependency-free (mirrors the real
// isUnauthorized check: instanceof ApiError && status === 401).
class FakeApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`status ${status}`);
    this.status = status;
  }
}
const isUnauthorized = (e: unknown) =>
  e instanceof FakeApiError && e.status === 401;

const base = {
  getToken: async () => "tok",
  send: async (t: string) => `sent:${t}`,
  refresh: async () => null as string | null,
  isUnauthorized,
  onMissingToken: async () => "missing",
  onRefreshExhausted: async () => "exhausted",
};

test("returns send() result with the resolved token, no refresh on success", async () => {
  let refreshed = 0;
  const result = await withAuthRetry<string>({
    ...base,
    refresh: async () => {
      refreshed += 1;
      return null;
    },
  });
  assert.equal(result, "sent:tok");
  assert.equal(refreshed, 0);
});

test("missing token short-circuits to onMissingToken (send not called)", async () => {
  let sent = 0;
  const result = await withAuthRetry<string>({
    ...base,
    getToken: async () => null,
    send: async (t) => {
      sent += 1;
      return `sent:${t}`;
    },
  });
  assert.equal(result, "missing");
  assert.equal(sent, 0);
});

test("401 -> refresh succeeds -> retries send with the new token", async () => {
  const tokensSeen: string[] = [];
  let first = true;
  const result = await withAuthRetry<string>({
    ...base,
    getToken: async () => "old",
    send: async (t) => {
      tokensSeen.push(t);
      if (first) {
        first = false;
        throw new FakeApiError(401);
      }
      return `ok:${t}`;
    },
    refresh: async () => "new",
  });
  assert.equal(result, "ok:new");
  assert.deepEqual(tokensSeen, ["old", "new"]);
});

test("401 -> refresh fails -> onRefreshExhausted receives the original error", async () => {
  const original = new FakeApiError(401);
  let exhaustedWith: unknown = null;
  const result = await withAuthRetry<string>({
    ...base,
    send: async () => {
      throw original;
    },
    refresh: async () => null,
    onRefreshExhausted: async (e) => {
      exhaustedWith = e;
      return "exhausted";
    },
  });
  assert.equal(result, "exhausted");
  assert.equal(exhaustedWith, original);
});

test("non-401 error propagates without refreshing", async () => {
  let refreshed = 0;
  await assert.rejects(
    withAuthRetry<string>({
      ...base,
      send: async () => {
        throw new FakeApiError(500);
      },
      refresh: async () => {
        refreshed += 1;
        return null;
      },
    }),
    (e: unknown) => e instanceof FakeApiError && e.status === 500,
  );
  assert.equal(refreshed, 0);
});

test("onMissingToken may throw (required-auth semantics)", async () => {
  await assert.rejects(
    withAuthRetry<string>({
      ...base,
      getToken: async () => null,
      onMissingToken: async () => {
        throw new FakeApiError(401);
      },
    }),
    (e: unknown) => e instanceof FakeApiError,
  );
});
