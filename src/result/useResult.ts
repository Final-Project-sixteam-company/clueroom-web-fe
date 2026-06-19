// Result domain hook — owns the final-deduction result state and the result
// polling spine. Extracted from the App god-component (Flutter result flow).
//
// 결과 흐름의 오케스트레이션(submitDeduction/retryResultLoad/openResultForSession)은
// 게임 폼·세션·기록을 교차로 읽으므로 App 오케스트레이터에 남고, 이 훅은 result 도메인
// 상태(submitting/pendingResultSessionId/result) + 회귀 민감 폴링(pollResult)을 소유한다.
// pollResult 의 8회 재시도 루프는 pollWithRetry 순수 함수로 고정됨(node:test).

import { useState } from "react";

import type { Result } from "../types";
import { pollWithRetry } from "../lib/pollWithRetry";
import { normalizeResult } from "../api/normalizers";
import type { AuthedRequest } from "../auth/useAuth";

export type UseResultArgs = {
  authedRequest: AuthedRequest;
};

export function useResult({ authedRequest }: UseResultArgs) {
  const [submitting, setSubmitting] = useState(false);
  const [pendingResultSessionId, setPendingResultSessionId] = useState<
    number | null
  >(null);
  const [result, setResult] = useState<Result | null>(null);

  async function pollResult(id: number) {
    return pollWithRetry(
      () =>
        authedRequest<unknown>(`/api/play-sessions/${id}/result`).then(
          normalizeResult,
        ),
      { attempts: 8, delayMs: 1500 },
    );
  }

  return {
    submitting,
    setSubmitting,
    pendingResultSessionId,
    setPendingResultSessionId,
    result,
    setResult,
    pollResult,
  };
}
