import { test } from "node:test";
import assert from "node:assert/strict";
import { createRefreshController } from "./refreshController.ts";

// A manually-resolvable promise so tests can interleave generation changes
// with an in-flight refresh deterministically.
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Payload = { accessToken: string };

function handlersFor(
  fetchTokens: () => Promise<Payload>,
  calls: { persist: Payload[]; clearOnFailure: number },
) {
  return {
    fetchTokens,
    extractToken: (p: Payload) => p.accessToken,
    persist: (p: Payload) => {
      calls.persist.push(p);
    },
    clearOnFailure: () => {
      calls.clearOnFailure += 1;
    },
  };
}

test("single-flight: concurrent refreshes share one in-flight promise and one fetch", async () => {
  const controller = createRefreshController();
  const gate = deferred<Payload>();
  let fetchCount = 0;
  const calls = { persist: [] as Payload[], clearOnFailure: 0 };

  const handlers = handlersFor(() => {
    fetchCount += 1;
    return gate.promise;
  }, calls);

  const a = controller.refresh(handlers);
  const b = controller.refresh(handlers);
  assert.equal(a, b, "concurrent calls must return the same in-flight promise");

  gate.resolve({ accessToken: "tok-1" });
  const [ra, rb] = await Promise.all([a, b]);

  assert.equal(fetchCount, 1, "fetch must run exactly once for the shared flight");
  assert.equal(ra, "tok-1");
  assert.equal(rb, "tok-1");
  assert.equal(calls.persist.length, 1, "persist runs once");
});

test("in-flight slot is released after settle, allowing a fresh refresh", async () => {
  const controller = createRefreshController();
  let fetchCount = 0;
  const calls = { persist: [] as Payload[], clearOnFailure: 0 };
  const handlers = handlersFor(async () => {
    fetchCount += 1;
    return { accessToken: `tok-${fetchCount}` };
  }, calls);

  const first = await controller.refresh(handlers);
  const second = await controller.refresh(handlers);

  assert.equal(first, "tok-1");
  assert.equal(second, "tok-2", "after the first settles a new refresh must run");
  assert.equal(fetchCount, 2);
});

test("generation guard (success): a bump while in flight discards the result (no persist)", async () => {
  const controller = createRefreshController();
  const gate = deferred<Payload>();
  const calls = { persist: [] as Payload[], clearOnFailure: 0 };
  const handlers = handlersFor(() => gate.promise, calls);

  const pending = controller.refresh(handlers);
  controller.bumpGeneration(); // session replaced mid-flight
  gate.resolve({ accessToken: "stale-tok" });
  const result = await pending;

  assert.equal(result, null, "stale success must resolve to null");
  assert.equal(calls.persist.length, 0, "stale tokens must NOT be persisted");
});

test("generation guard (failure): a bump while in flight suppresses clearOnFailure", async () => {
  const controller = createRefreshController();
  const gate = deferred<Payload>();
  const calls = { persist: [] as Payload[], clearOnFailure: 0 };
  const handlers = handlersFor(() => gate.promise, calls);

  const pending = controller.refresh(handlers);
  controller.bumpGeneration(); // newer session exists
  gate.reject(new Error("refresh failed"));
  const result = await pending;

  assert.equal(result, null);
  assert.equal(
    calls.clearOnFailure,
    0,
    "a stale failure must not clear the newer session's tokens",
  );
});

test("bumpGeneration() drops the stale in-flight slot after session replacement", async () => {
  const controller = createRefreshController();
  const gate1 = deferred<Payload>();
  let fetchCount = 0;
  const calls = { persist: [] as Payload[], clearOnFailure: 0 };

  const first = controller.refresh(
    handlersFor(() => {
      fetchCount += 1;
      return gate1.promise;
    }, calls),
  );

  controller.bumpGeneration(); // a new login/session replaced the old one

  const gate2 = deferred<Payload>();
  const second = controller.refresh(
    handlersFor(() => {
      fetchCount += 1;
      return gate2.promise;
    }, calls),
  );

  assert.notEqual(first, second, "new session must not share the stale flight");
  assert.equal(fetchCount, 2, "session replacement must allow a fresh refresh");

  gate1.resolve({ accessToken: "old-session" });
  gate2.resolve({ accessToken: "new-session" });
  const [r1, r2] = await Promise.all([first, second]);

  assert.equal(r1, null, "old-session flight is stale after replacement");
  assert.equal(r2, "new-session");
  assert.deepEqual(calls.persist, [{ accessToken: "new-session" }]);
});

test("failure with unchanged generation clears tokens", async () => {
  const controller = createRefreshController();
  const calls = { persist: [] as Payload[], clearOnFailure: 0 };
  const handlers = handlersFor(async () => {
    throw new Error("refresh failed");
  }, calls);

  const result = await controller.refresh(handlers);

  assert.equal(result, null);
  assert.equal(calls.clearOnFailure, 1, "a real failure must clear tokens once");
});

test("reset() drops the in-flight slot so the next refresh starts fresh", async () => {
  const controller = createRefreshController();
  const gate1 = deferred<Payload>();
  let fetchCount = 0;
  const calls = { persist: [] as Payload[], clearOnFailure: 0 };

  const first = controller.refresh(
    handlersFor(() => {
      fetchCount += 1;
      return gate1.promise;
    }, calls),
  );

  controller.reset(); // logout: bump generation + clear in-flight

  const gate2 = deferred<Payload>();
  const second = controller.refresh(
    handlersFor(() => {
      fetchCount += 1;
      return gate2.promise;
    }, calls),
  );

  assert.notEqual(first, second, "after reset a new flight must be created");
  assert.equal(fetchCount, 2, "reset must not reuse the stale in-flight promise");

  // The first (pre-reset) flight resolving must not persist (generation bumped).
  gate1.resolve({ accessToken: "pre-reset" });
  gate2.resolve({ accessToken: "post-reset" });
  const [r1, r2] = await Promise.all([first, second]);

  assert.equal(r1, null, "pre-reset flight is stale after reset");
  assert.equal(r2, "post-reset");
  assert.equal(calls.persist.length, 1, "only the post-reset flight persists");
});
