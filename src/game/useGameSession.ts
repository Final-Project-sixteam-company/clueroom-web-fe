// Game-session domain hook — owns the active investigation: case dashboard,
// evidences/suspects/timeline/locations/hints, evidence & suspect detail, the
// interrogation chat, and the final-deduction draft form. Extracted verbatim
// from the App god-component (Flutter game_session flow).
//
// 회귀 민감 코어가 여기 모여 있다:
//  - 30초 status-gated 폴링 + 1초 타이머(loadCaseRef + advanceCaseTimer 순수 함수, node:test 고정)
//  - 401→refresh→retry 는 주입받은 authedRequest 가 처리(useAuth 소유)
// 교차도메인은 주입: view(폴링 게이트), setView(네비), saveInProgressRecord(records).
// 결과 흐름(submitDeduction/result)은 App 오케스트레이터가 이 훅의 폼/세션 상태를 읽어 처리.

import { useEffect, useMemo, useRef, useState } from "react";

import { CASE_REFRESH_SECONDS } from "../config/env";
import { advanceCaseTimer } from "./caseTimer";
import type {
  Dashboard,
  CaseLocation,
  Hint,
  Evidence,
  SuggestedQuestion,
  InterrogationLog,
  Suspect,
  TimelineEvent,
  ChatMessage,
  Scenario,
  View,
  AiQuotaStatus,
} from "../types";
import {
  normalizeEvidence,
  normalizeTimelineEvent,
  normalizeLocationPayload,
  normalizeHint,
  normalizeSuspect,
  normalizeInterrogationLog,
  messagesFromLogs,
} from "../api/normalizers";
import { ApiError } from "../api/ApiError";
import type { AuthedRequest } from "../auth/useAuth";

export type UseGameSessionArgs = {
  /** 폴링 effect 게이트(view === "case"). App 이 소유한 view 를 주입. */
  view: View;
  authToken: string | null;
  authedRequest: AuthedRequest;
  setView: (view: View) => void;
  saveInProgressRecord: (
    nextSessionId: number,
    scenario: Scenario,
  ) => Promise<void>;
};

export function useGameSession({
  view,
  authToken,
  authedRequest,
  setView,
  saveInProgressRecord,
}: UseGameSessionArgs) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [caseTab, setCaseTab] = useState<
    "scene" | "evidence" | "suspects" | "timeline"
  >("scene");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [locations, setLocations] = useState<CaseLocation[]>([]);
  const [caseMapImageUrl, setCaseMapImageUrl] = useState<string | undefined>();
  const [hints, setHints] = useState<Hint[]>([]);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(
    null,
  );
  const [evidenceDetailLoading, setEvidenceDetailLoading] = useState(false);
  const [evidenceDetailError, setEvidenceDetailError] = useState<string | null>(
    null,
  );
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [suspectLogs, setSuspectLogs] = useState<InterrogationLog[]>([]);
  const [suspectDetailLoading, setSuspectDetailLoading] = useState(false);

  const [chatSuspect, setChatSuspect] = useState<Suspect | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [pendingEvidenceId, setPendingEvidenceId] = useState<number | null>(
    null,
  );
  const [pendingQuestionType, setPendingQuestionType] = useState<
    "FREE" | "RECOMMENDED" | "EVIDENCE_PRESENTED"
  >("FREE");
  const [chatLoading, setChatLoading] = useState(false);
  const [aiQuotaStatus, setAiQuotaStatus] = useState<AiQuotaStatus | null>(null);

  const [selectedCulpritId, setSelectedCulpritId] = useState<number | null>(
    null,
  );
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<number[]>([]);
  const [motiveText, setMotiveText] = useState("");
  const [methodText, setMethodText] = useState("");
  const [coverUpText, setCoverUpText] = useState("");

  const dashboardSessionId = dashboard?.sessionId;
  const dashboardStatus = dashboard?.status;
  const loadCaseRef = useRef<
    (id?: number | null, options?: { silent?: boolean }) => Promise<void>
  >(async () => {});

  useEffect(() => {
    if (view !== "case" || !dashboardSessionId || dashboardStatus === "COMPLETED") {
      return;
    }

    const timerId = window.setInterval(() => {
      let shouldRefresh = false;
      setDashboard((current) => {
        const ticked = advanceCaseTimer(
          current,
          dashboardSessionId,
          CASE_REFRESH_SECONDS,
        );
        shouldRefresh = ticked.shouldRefresh;
        return ticked.next;
      });
      if (shouldRefresh) {
        void loadCaseRef.current(dashboardSessionId, { silent: true });
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [dashboardSessionId, dashboardStatus, view]);

  async function findActiveSession(scenarioId: number) {
    if (!authToken) return null;
    const active = await authedRequest<{
      hasActiveSession?: boolean;
      activeSessionId?: number;
    }>("/api/play-sessions/active", {
      query: { scenarioId },
    });
    return active.hasActiveSession ? Number(active.activeSessionId) : null;
  }

  async function startSession(scenario: Scenario) {
    if (!authToken) {
      setView("login");
      return;
    }

    setCaseLoading(true);
    setCaseError(null);
    try {
      let nextSessionId = await findActiveSession(scenario.scenarioId);

      if (!nextSessionId) {
        try {
          const created = await authedRequest<{ sessionId: number }>(
            "/api/play-sessions",
            {
              method: "POST",
              body: JSON.stringify({ scenarioId: scenario.scenarioId }),
            },
          );
          nextSessionId = created.sessionId;
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            nextSessionId = await findActiveSession(scenario.scenarioId);
          }
          if (!nextSessionId) throw error;
        }
      }

      setSessionId(nextSessionId);
      setCaseTab("scene");
      setAiQuotaStatus(null);
      setView("case");
      await saveInProgressRecord(nextSessionId, scenario);
      await loadCase(nextSessionId);
    } catch (error) {
      setCaseError(
        error instanceof Error ? error.message : "세션을 시작하지 못했습니다.",
      );
    } finally {
      setCaseLoading(false);
    }
  }

  async function loadCase(
    id = sessionId,
    options: { silent?: boolean } = {},
  ) {
    if (!id || !authToken) return;
    if (!options.silent) {
      setCaseLoading(true);
      setCaseError(null);
    }
    try {
      const [nextDashboard, evidenceData, suspectData] = await Promise.all([
        authedRequest<Dashboard>(`/api/play-sessions/${id}/dashboard`),
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/evidences`,
          {
            query: { includeLocked: true },
          },
        ),
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/suspects`,
        ),
      ]);

      setDashboard(nextDashboard);
      setEvidences(evidenceData.map(normalizeEvidence));
      setSuspects(suspectData.map(normalizeSuspect));

      const [timelineData, locationData, hintData] = await Promise.all([
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/timeline`,
        ).catch(() => null),
        authedRequest<unknown>(`/api/play-sessions/${id}/locations`).catch(
          () => null,
        ),
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/hints`,
        ).catch(() => null),
      ]);

      if (timelineData) {
        setTimeline(timelineData.map(normalizeTimelineEvent));
      } else if (!options.silent) {
        setTimeline([]);
      }

      if (locationData) {
        const locationPayload = normalizeLocationPayload(locationData);
        setCaseMapImageUrl(locationPayload.mapImageUrl);
        setLocations(locationPayload.locations);
      } else if (!options.silent) {
        setCaseMapImageUrl(undefined);
        setLocations([]);
      }

      if (hintData) {
        setHints(hintData.map(normalizeHint));
      } else if (!options.silent) {
        setHints([]);
      }
    } catch (error) {
      if (!options.silent) {
        setCaseError(
          error instanceof Error
            ? error.message
            : "수사 정보를 불러오지 못했습니다.",
        );
      }
    } finally {
      if (!options.silent) {
        setCaseLoading(false);
      }
    }
  }

  loadCaseRef.current = loadCase;

  /** 세션/사건 상태 초기화 — 로그아웃(App onLogout)·중단 성공 경로 공통. 네비게이션은 호출처가 담당. */
  function resetGameSession() {
    setSessionId(null);
    setDashboard(null);
    setEvidences([]);
    setSuspects([]);
    setTimeline([]);
    setLocations([]);
    setCaseMapImageUrl(undefined);
    setHints([]);
    setAiQuotaStatus(null);
  }

  async function abandonSession() {
    if (!sessionId) {
      setView("library");
      return;
    }
    // 중단 확인은 CaseHubScreen 의 AbandonDialog(kit Modal)가 소유 — 여기선 confirm 없이 실행.
    try {
      await authedRequest<void>(`/api/play-sessions/${sessionId}/abandon`, {
        method: "POST",
      });
      setSessionId(null);
      setDashboard(null);
      setEvidences([]);
      setSuspects([]);
      setTimeline([]);
      setLocations([]);
      setCaseMapImageUrl(undefined);
      setHints([]);
      setAiQuotaStatus(null);
      setView("library");
    } catch (error) {
      if (error instanceof ApiError && error.code === "P003") {
        setCaseError("최종 추리 처리 중입니다. 잠시 후 결과를 다시 확인해 주세요.");
        await loadCase(sessionId, { silent: true });
        return;
      }
      setCaseError(
        error instanceof Error ? error.message : "수사를 중단하지 못했습니다.",
      );
    }
  }

  async function openEvidenceDetail(evidence: Evidence) {
    setSelectedEvidence(evidence);
    setEvidenceDetailError(null);
    setView("evidenceDetail");
    if (!sessionId || !authToken || !evidence.isUnlocked) return;

    setEvidenceDetailLoading(true);
    try {
      const detail = await authedRequest<Record<string, unknown>>(
        `/api/play-sessions/${sessionId}/evidences/${evidence.evidenceId}`,
      );
      setSelectedEvidence({
        ...evidence,
        ...normalizeEvidence(detail),
        isUnlocked: true,
      });
    } catch (error) {
      setEvidenceDetailError(
        error instanceof Error
          ? error.message
          : "증거 상세를 불러오지 못했습니다.",
      );
    } finally {
      setEvidenceDetailLoading(false);
    }
  }

  async function useHint(hint: Hint) {
    if (!sessionId || !authToken || !hint.isAvailable || hint.isUsed) return;
    try {
      const used = await authedRequest<Record<string, unknown>>(
        `/api/play-sessions/${sessionId}/hints/${hint.hintId}/use`,
        { method: "POST" },
      );
      setHints((prev) =>
        prev.map((item) =>
          item.hintId === hint.hintId
            ? {
                ...item,
                isUsed: true,
                content:
                  typeof used.content === "string"
                    ? used.content
                    : item.content,
              }
            : item,
        ),
      );
      await loadCase();
    } catch (error) {
      setCaseError(
        error instanceof Error ? error.message : "힌트를 사용할 수 없습니다.",
      );
    }
  }

  async function openSuspectDetail(suspect: Suspect) {
    setSelectedSuspect(suspect);
    setSuspectLogs([]);
    setView("suspectDetail");
    if (!sessionId || !authToken) return;

    setSuspectDetailLoading(true);
    try {
      const logs = await authedRequest<Record<string, unknown>[]>(
        `/api/play-sessions/${sessionId}/interrogations`,
        {
          query: { suspectId: suspect.suspectId },
        },
      );
      setSuspectLogs(logs.map(normalizeInterrogationLog));
    } catch {
      setSuspectLogs([]);
    } finally {
      setSuspectDetailLoading(false);
    }
  }

  async function openChat(suspect: Suspect, prefill?: SuggestedQuestion) {
    setChatSuspect(suspect);
    const fallbackMessage = suspect.publicStatement?.trim() || "무엇이 궁금하신가요?";
    setMessages([{ sender: "suspect", text: fallbackMessage }]);
    setQuestion(prefill?.question ?? "");
    setPendingEvidenceId(prefill?.presentedEvidenceId ?? null);
    setPendingQuestionType(
      prefill?.presentedEvidenceId
        ? "EVIDENCE_PRESENTED"
        : prefill?.questionType === "RECOMMENDED"
          ? "RECOMMENDED"
          : prefill
            ? "RECOMMENDED"
            : "FREE",
    );
    setView("chat");
    if (!sessionId || !authToken) return;

    try {
      const logs = await authedRequest<Record<string, unknown>[]>(
        `/api/play-sessions/${sessionId}/interrogations`,
        {
          query: { suspectId: suspect.suspectId },
        },
      );
      setMessages(
        messagesFromLogs(logs.map(normalizeInterrogationLog), fallbackMessage),
      );
    } catch {
      // 기존 대화를 못 불러와도 새 심문은 계속 가능해야 한다.
    }
  }

  async function sendQuestion() {
    const trimmed = question.trim();
    if (!sessionId || !authToken || !chatSuspect || !trimmed || chatLoading) {
      return;
    }

    const outgoingType = pendingEvidenceId
      ? "EVIDENCE_PRESENTED"
      : pendingQuestionType;
    setChatLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        sender: "detective",
        text: trimmed,
        presentedEvidenceId: pendingEvidenceId ?? undefined,
      },
    ]);
    setQuestion("");

    try {
      const answer = await authedRequest<{
        answer?: string;
        unlockedEvidences?: { evidenceId: number; title: string }[];
        aiQuota?: AiQuotaStatus | null;
      }>(`/api/play-sessions/${sessionId}/interrogations`, {
        method: "POST",
        body: JSON.stringify({
          suspectId: chatSuspect.suspectId,
          questionType: outgoingType,
          question: trimmed,
          ...(pendingEvidenceId
            ? { presentedEvidenceId: pendingEvidenceId }
            : {}),
        }),
      });
      setMessages((prev) => [
        ...prev,
        {
          sender: "suspect",
          text: answer.answer ?? "답변을 받지 못했습니다.",
        },
      ]);
      setAiQuotaStatus(
        answer.aiQuota && answer.aiQuota.stage !== "NONE" ? answer.aiQuota : null,
      );
      setPendingEvidenceId(null);
      setPendingQuestionType("FREE");
      await loadCase();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "suspect",
          text:
            error instanceof Error
              ? error.message
              : "심문 요청에 실패했습니다.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const unlockedEvidences = useMemo(
    () => evidences.filter((e) => e.isUnlocked),
    [evidences],
  );
  const accusableSuspects = useMemo(
    () => suspects.filter((s) => !s.isWitness),
    [suspects],
  );

  return {
    sessionId,
    caseTab,
    setCaseTab,
    dashboard,
    evidences,
    suspects,
    timeline,
    locations,
    caseMapImageUrl,
    hints,
    caseLoading,
    caseError,
    setCaseError,
    selectedEvidence,
    evidenceDetailLoading,
    evidenceDetailError,
    selectedSuspect,
    suspectLogs,
    suspectDetailLoading,
    chatSuspect,
    messages,
    question,
    setQuestion,
    pendingEvidenceId,
    setPendingEvidenceId,
    pendingQuestionType,
    setPendingQuestionType,
    chatLoading,
    aiQuotaStatus,
    unlockedEvidences,
    accusableSuspects,
    selectedCulpritId,
    setSelectedCulpritId,
    selectedEvidenceIds,
    setSelectedEvidenceIds,
    motiveText,
    setMotiveText,
    methodText,
    setMethodText,
    coverUpText,
    setCoverUpText,
    startSession,
    loadCase,
    abandonSession,
    openEvidenceDetail,
    openSuspectDetail,
    openChat,
    sendQuestion,
    useHint,
    resetGameSession,
  };
}
