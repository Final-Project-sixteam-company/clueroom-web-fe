// Records domain hook — owns the play-record list state and its load/persist
// spine. Extracted verbatim from the App god-component (Flutter my_records).
// Account API(authToken 있을 때) → 로컬 스토리지 폴백 흐름 보존.
//
// 교차도메인 한 가지: saveCompletedRecord 는 게임/시나리오 상태(sessionId·dashboard·
// selectedScenario)를 메타로 읽었는데, 이를 App(오케스트레이터)이 호출 시점에
// CompletedRecordContext 로 주입하도록 바꿔 훅을 records 단일 도메인으로 유지한다.

import { useEffect, useState } from "react";

import { RECORDS_KEY } from "../config/env";
import type { RecordItem, Result, Scenario } from "../types";
import { safeGet, safeSet, safeRemove } from "../lib/storage";
import { normalizeRecord } from "../api/normalizers";
import type { AuthedRequest } from "../auth/useAuth";

export type UseRecordsArgs = {
  authReady: boolean;
  authToken: string | null;
  authedRequest: AuthedRequest;
};

/** 최종 추리 완료 기록의 교차도메인 메타 — App 이 게임/시나리오 상태에서 공급. */
export type CompletedRecordContext = {
  sessionId: number | null;
  scenarioId?: number;
  scenarioTitle?: string;
};

export function useRecords({
  authReady,
  authToken,
  authedRequest,
}: UseRecordsArgs) {
  const [records, setRecords] = useState<RecordItem[]>([]);

  async function loadLocalRecords() {
    const stored = await safeGet(RECORDS_KEY);
    if (!stored) {
      setRecords([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      const list = Array.isArray(parsed)
        ? parsed
            .map(normalizeRecord)
            .filter((item): item is RecordItem => !!item)
        : [];
      setRecords(list);
    } catch {
      await safeRemove(RECORDS_KEY);
      setRecords([]);
    }
  }

  async function loadRecords() {
    if (authToken) {
      try {
        const data = await authedRequest<
          { content?: Record<string, unknown>[] } | Record<string, unknown>[]
        >("/api/play-sessions/records", { query: { page: 0, size: 30 } });
        const list = (Array.isArray(data) ? data : (data.content ?? []))
          .map(normalizeRecord)
          .filter((item): item is RecordItem => !!item);
        setRecords(list);
        return;
      } catch {
        // Backend record API may not be deployed yet. Keep the web usable with local records.
      }
    }

    await loadLocalRecords();
  }

  async function persistRecords(next: RecordItem[]) {
    const sorted = [...next]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 30);
    setRecords(sorted);
    await safeSet(RECORDS_KEY, JSON.stringify(sorted));
  }

  async function upsertRecord(record: RecordItem) {
    const stored = await safeGet(RECORDS_KEY);
    const storedRecords = stored
      ? (() => {
          try {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed)
              ? parsed
                  .map(normalizeRecord)
                  .filter((item): item is RecordItem => !!item)
              : [];
          } catch {
            return [];
          }
        })()
      : [];
    const source = records.length ? records : storedRecords;
    const next = [
      record,
      ...source.filter((item) => item.recordId !== record.recordId),
    ];
    await persistRecords(next);
  }

  async function saveInProgressRecord(
    nextSessionId: number,
    scenario: Scenario,
  ) {
    await upsertRecord({
      recordId: `session-${nextSessionId}`,
      sessionId: nextSessionId,
      scenarioId: scenario.scenarioId,
      scenarioTitle: scenario.title,
      status: "IN_PROGRESS",
      updatedAt: new Date().toISOString(),
    });
  }

  async function saveCompletedRecord(
    finalResult: Result,
    context: CompletedRecordContext,
  ) {
    await upsertRecord({
      recordId: `session-${finalResult.sessionId || context.sessionId || Date.now()}`,
      sessionId: finalResult.sessionId || context.sessionId || undefined,
      scenarioId: context.scenarioId,
      scenarioTitle: context.scenarioTitle ?? "완료한 사건",
      status: "COMPLETED",
      score: finalResult.score,
      grade: finalResult.grade,
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  }

  useEffect(() => {
    if (authReady) void loadRecords();
    // Records prefer account API after auth bootstrap, then fall back to local storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authToken]);

  return { records, saveInProgressRecord, saveCompletedRecord };
}
