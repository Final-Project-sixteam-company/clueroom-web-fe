import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceCaseTimer } from "./caseTimer.ts";
import type { Dashboard } from "../types.ts";

// 순수 함수는 sessionId/elapsedSeconds 만 읽으므로 최소 객체로 충분.
// (node:test 타입스트리핑 — `as Dashboard` 캐스트는 런타임에서 소거됨.)
function make(sessionId: number, elapsedSeconds: number): Dashboard {
  return { sessionId, elapsedSeconds } as Dashboard;
}

const REFRESH = 30; // CASE_REFRESH_SECONDS

test("tick increments elapsedSeconds by 1 and is a no-refresh before the boundary", () => {
  const { next, shouldRefresh } = advanceCaseTimer(make(7, 5), 7, REFRESH);
  assert.equal(next?.elapsedSeconds, 6);
  assert.equal(shouldRefresh, false);
});

test("shouldRefresh fires exactly on multiples of refreshSeconds", () => {
  // 29 -> 30 발화
  assert.equal(advanceCaseTimer(make(7, 29), 7, REFRESH).shouldRefresh, true);
  // 59 -> 60 발화
  assert.equal(advanceCaseTimer(make(7, 59), 7, REFRESH).shouldRefresh, true);
});

test("shouldRefresh does NOT fire on the tick right after a refresh", () => {
  // 30 -> 31 미발화 (직전 tick 에서 이미 발화했음)
  assert.equal(advanceCaseTimer(make(7, 30), 7, REFRESH).shouldRefresh, false);
  // 28 -> 29 미발화
  assert.equal(advanceCaseTimer(make(7, 28), 7, REFRESH).shouldRefresh, false);
});

test("sessionId mismatch is a no-op (preserves session-switch gating)", () => {
  const current = make(7, 29);
  const { next, shouldRefresh } = advanceCaseTimer(current, 999, REFRESH);
  assert.equal(next, current, "다른 세션이면 동일 참조 반환(무변경)");
  assert.equal(shouldRefresh, false);
});

test("null current is a no-op", () => {
  const { next, shouldRefresh } = advanceCaseTimer(null, 7, REFRESH);
  assert.equal(next, null);
  assert.equal(shouldRefresh, false);
});

test("does not mutate the input dashboard (returns a new object)", () => {
  const current = make(7, 10);
  const { next } = advanceCaseTimer(current, 7, REFRESH);
  assert.equal(current.elapsedSeconds, 10, "입력 불변");
  assert.notEqual(next, current, "새 객체 반환");
});
