import type { Dashboard } from "../types";

/**
 * 정본: App.tsx 의 in-case 1초 타이머 effect (회귀 민감 — 핸드오프 보존 목록).
 * Flutter game 화면이 PLAYING 동안 1초마다 elapsedSeconds 를 올리고,
 * 누적이 CASE_REFRESH_SECONDS(30초)의 배수가 되는 tick 에서만 대시보드를 silent 재조회한다.
 *
 * 한 번의 tick 에서:
 *  - current 가 없거나 sessionId 가 다르면 무변경(no-op) — 세션 전환/폴링 게이팅 경계 보존.
 *  - 그 외엔 elapsedSeconds 를 1 증가시키고, 누적이 refreshSeconds 의 배수인 tick 에서만 shouldRefresh.
 *
 * React 무관 순수 함수로 빼서 node:test 로 경계(29→30 발화, 30→31 미발화)를 고정한다.
 */
export function advanceCaseTimer(
  current: Dashboard | null,
  sessionId: number,
  refreshSeconds: number,
): { next: Dashboard | null; shouldRefresh: boolean } {
  if (!current || current.sessionId !== sessionId) {
    return { next: current, shouldRefresh: false };
  }
  const elapsedSeconds = current.elapsedSeconds + 1;
  return {
    next: { ...current, elapsedSeconds },
    shouldRefresh: elapsedSeconds % refreshSeconds === 0,
  };
}
