import { test } from "node:test";
import assert from "node:assert/strict";
import { pollWithRetry } from "./pollWithRetry.ts";

// 실제 대기 없이 sleep 호출 횟수만 기록하는 페이크.
function fakeSleep() {
  const calls: number[] = [];
  const sleep = (ms: number) => {
    calls.push(ms);
    return Promise.resolve();
  };
  return { sleep, calls };
}

test("returns on the first attempt without sleeping", async () => {
  let fetchCount = 0;
  const { sleep, calls } = fakeSleep();
  const value = await pollWithRetry(
    async () => {
      fetchCount += 1;
      return "ok";
    },
    { attempts: 8, delayMs: 1500, sleep },
  );
  assert.equal(value, "ok");
  assert.equal(fetchCount, 1);
  assert.equal(calls.length, 0, "성공 시 sleep 안 함");
});

test("retries after failures and returns the first success", async () => {
  let fetchCount = 0;
  const { sleep, calls } = fakeSleep();
  const value = await pollWithRetry(
    async () => {
      fetchCount += 1;
      if (fetchCount < 3) throw new Error(`fail-${fetchCount}`);
      return "late-ok";
    },
    { attempts: 8, delayMs: 1500, sleep },
  );
  assert.equal(value, "late-ok");
  assert.equal(fetchCount, 3, "2번 실패 후 3번째 성공");
  assert.deepEqual(calls, [1500, 1500], "실패한 횟수만큼만 sleep");
});

test("throws the LAST error after all attempts fail", async () => {
  let fetchCount = 0;
  const { sleep, calls } = fakeSleep();
  await assert.rejects(
    pollWithRetry(
      async () => {
        fetchCount += 1;
        throw new Error(`fail-${fetchCount}`);
      },
      { attempts: 8, delayMs: 1500, sleep },
    ),
    /fail-8/,
    "마지막(8번째) 에러를 던진다",
  );
  assert.equal(fetchCount, 8, "attempts 만큼 시도");
  assert.equal(calls.length, 8, "정본과 1:1 — 마지막 실패도 throw 전 sleep");
});

test("respects a smaller attempts budget", async () => {
  let fetchCount = 0;
  const { sleep } = fakeSleep();
  await assert.rejects(
    pollWithRetry(
      async () => {
        fetchCount += 1;
        throw new Error("nope");
      },
      { attempts: 3, delayMs: 10, sleep },
    ),
  );
  assert.equal(fetchCount, 3);
});

test("uses the provided delayMs for the sleep interval", async () => {
  const { sleep, calls } = fakeSleep();
  await pollWithRetry(
    async () => {
      if (calls.length < 1) throw new Error("once");
      return "done";
    },
    { attempts: 5, delayMs: 777, sleep },
  );
  assert.deepEqual(calls, [777]);
});
