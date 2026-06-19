import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { HomeScreen } from "./components/screens/HomeScreen";
import { LibraryScreen } from "./components/screens/LibraryScreen";
import { ScenarioDetailScreen } from "./components/screens/ScenarioDetailScreen";
import { LoginScreen } from "./components/screens/LoginScreen";
import { CaseBriefingScreen } from "./components/screens/CaseBriefingScreen";
import { CaseHubScreen } from "./components/screens/case/CaseHubScreen";
import { InterrogationChatScreen } from "./components/screens/interrogation/InterrogationChatScreen";
import { EvidenceDetailScreen } from "./components/screens/EvidenceDetailScreen";
import { SuspectDetailScreen } from "./components/screens/SuspectDetailScreen";
import { SubmitScreen } from "./components/screens/SubmitScreen";
import { ResultScreen } from "./components/screens/ResultScreen";
import { RecordsScreen } from "./components/screens/RecordsScreen";
import { ProfileScreen } from "./components/screens/ProfileScreen";
import { BookmarksScreen } from "./components/screens/BookmarksScreen";
import { BottomNav, APP_NAV_ITEMS } from "./components/ui";
import {
  RECORDS_KEY,
  CASE_REFRESH_SECONDS,
  MIN_DEDUCTION_TEXT_LENGTH,
} from "./config/env";
import type {
  View,
  RecordItem,
  ImagePreview,
  ScenarioFilterState,
  ScenarioPagePayload,
  ScenarioReview,
  ReviewDraftTarget,
  Scenario,
  Dashboard,
  CaseLocation,
  Hint,
  Evidence,
  SuggestedQuestion,
  InterrogationLog,
  Suspect,
  TimelineEvent,
  ChatMessage,
  Result,
} from "./types";
import { safeGet, safeSet, safeRemove, delay } from "./lib/storage";
import { ApiError } from "./api/ApiError";
import {
  normalizeScenario,
  buildScenarioQuery,
  normalizeScenarioPage,
  normalizeEvidence,
  normalizeTimelineEvent,
  normalizeLocationPayload,
  normalizeHint,
  normalizeSuspect,
  normalizeInterrogationLog,
  messagesFromLogs,
  normalizeRecord,
  normalizeReview,
  normalizeResult,
} from "./api/normalizers";
import { useAuth } from "./auth/useAuth";

function App() {
  const [view, setView] = useState<View>("home");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilterState>({
    query: "",
    sort: "popular",
    type: "",
    difficulty: "",
  });
  const [bookmarkedScenarioIds, setBookmarkedScenarioIds] = useState<number[]>(
    [],
  );
  const [bookmarkedScenarios, setBookmarkedScenarios] = useState<Scenario[]>(
    [],
  );
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [bookmarksError, setBookmarksError] = useState<string | null>(null);
  const [scenarioReviews, setScenarioReviews] = useState<ScenarioReview[]>([]);
  const [reviewDraftTarget, setReviewDraftTarget] =
    useState<ReviewDraftTarget | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioLoadingMore, setScenarioLoadingMore] = useState(false);
  const [scenarioPage, setScenarioPage] = useState(0);
  const [scenarioHasNext, setScenarioHasNext] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null,
  );
  const [scenarioDetailBackView, setScenarioDetailBackView] =
    useState<View>("library");
  const [scenarioDetailLoading, setScenarioDetailLoading] = useState(false);
  const [scenarioDetailError, setScenarioDetailError] = useState<string | null>(
    null,
  );

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

  const [selectedCulpritId, setSelectedCulpritId] = useState<number | null>(
    null,
  );
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<number[]>([]);
  const [motiveText, setMotiveText] = useState("");
  const [methodText, setMethodText] = useState("");
  const [coverUpText, setCoverUpText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingResultSessionId, setPendingResultSessionId] = useState<
    number | null
  >(null);
  const [result, setResult] = useState<Result | null>(null);

  const {
    tokens,
    authToken,
    authReady,
    authError,
    setAuthError,
    profile,
    profileLoading,
    profileError,
    authedRequest,
    optionalAuthRequest,
    loadProfile,
    logout,
    handleGoogleCredential,
    handleDevLogin,
  } = useAuth({
    onAuthenticated: () => setView("home"),
    onLogout: () => {
      setSessionId(null);
      setDashboard(null);
      setEvidences([]);
      setSuspects([]);
      setTimeline([]);
      setLocations([]);
      setCaseMapImageUrl(undefined);
      setHints([]);
      setView("login");
    },
  });

  useEffect(() => {
    if (authReady) void loadScenarios();
    // Initial library load only; filter changes call applyScenarioFilter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authToken]);

  useEffect(() => {
    if (authReady) void loadRecords();
    // Records prefer account API after auth bootstrap, then fall back to local storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authToken]);

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
      setDashboard((current) =>
        current && current.sessionId === dashboardSessionId
          ? (() => {
              const elapsedSeconds = current.elapsedSeconds + 1;
              shouldRefresh = elapsedSeconds % CASE_REFRESH_SECONDS === 0;
              return { ...current, elapsedSeconds };
            })()
          : current,
      );
      if (shouldRefresh) {
        void loadCaseRef.current(dashboardSessionId, { silent: true });
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [dashboardSessionId, dashboardStatus, view]);

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

  function persistBookmarks(ids: number[]) {
    const uniqueIds = [...new Set(ids)];
    setBookmarkedScenarioIds(uniqueIds);
  }

  async function toggleScenarioBookmark(scenarioId: number) {
    if (!authToken) {
      setAuthError("저장은 로그인 후 사용할 수 있습니다.");
      setView("login");
      return;
    }

    const wasBookmarked = bookmarkedScenarioIds.includes(scenarioId);
    const next = wasBookmarked
      ? bookmarkedScenarioIds.filter((id) => id !== scenarioId)
      : [scenarioId, ...bookmarkedScenarioIds];
    persistBookmarks(next);
    setScenarios((current) =>
      current.map((scenario) =>
        scenario.scenarioId === scenarioId
          ? { ...scenario, isBookmarked: !wasBookmarked }
          : scenario,
      ),
    );
    setSelectedScenario((current) =>
      current?.scenarioId === scenarioId
        ? { ...current, isBookmarked: !wasBookmarked }
        : current,
    );
    setBookmarkedScenarios((current) => {
      if (wasBookmarked) {
        return current.filter((scenario) => scenario.scenarioId !== scenarioId);
      }
      const source =
        selectedScenario?.scenarioId === scenarioId
          ? selectedScenario
          : scenarios.find((scenario) => scenario.scenarioId === scenarioId);
      if (!source || current.some((scenario) => scenario.scenarioId === scenarioId)) {
        return current;
      }
      return [{ ...source, isBookmarked: true }, ...current];
    });

    try {
      await authedRequest(`/api/scenarios/${scenarioId}/bookmarks`, {
        method: wasBookmarked ? "DELETE" : "POST",
      });
    } catch (error) {
      if (
        error instanceof ApiError &&
        ((error.status === 409 && !wasBookmarked) ||
          (error.status === 404 && wasBookmarked))
      ) {
        setScenarioDetailError(null);
        return;
      }

      persistBookmarks(bookmarkedScenarioIds);
      setScenarios((current) =>
        current.map((scenario) =>
          scenario.scenarioId === scenarioId
            ? { ...scenario, isBookmarked: wasBookmarked }
            : scenario,
        ),
      );
      setSelectedScenario((current) =>
        current?.scenarioId === scenarioId
          ? { ...current, isBookmarked: wasBookmarked }
          : current,
      );
      setBookmarkedScenarios((current) => {
        if (!wasBookmarked) {
          return current.filter((scenario) => scenario.scenarioId !== scenarioId);
        }
        const source =
          selectedScenario?.scenarioId === scenarioId
            ? selectedScenario
            : scenarios.find((scenario) => scenario.scenarioId === scenarioId);
        if (!source || current.some((scenario) => scenario.scenarioId === scenarioId)) {
          return current;
        }
        return [{ ...source, isBookmarked: true }, ...current];
      });
      setScenarioDetailError(
        error instanceof Error ? error.message : "저장 상태를 바꾸지 못했습니다.",
      );
    }
  }

  async function loadScenarioReviews(scenarioId: number) {
    try {
      const data = await optionalAuthRequest<
        { content?: Record<string, unknown>[] } | Record<string, unknown>[]
      >(`/api/scenarios/${scenarioId}/reviews`, {
        query: {
          page: 0,
          size: 20,
          sort: "latest,desc",
          includeSpoiler: true,
        },
      });
      const list = Array.isArray(data) ? data : (data.content ?? []);
      const normalized = list
        .map((item) => normalizeReview(item, scenarioId))
        .filter((item): item is ScenarioReview => !!item);
      setScenarioReviews((current) => [
        ...normalized,
        ...current.filter((review) => review.scenarioId !== scenarioId),
      ]);
    } catch (error) {
      setScenarioDetailError(
        error instanceof Error ? error.message : "리뷰를 불러오지 못했습니다.",
      );
    }
  }

  async function addScenarioReview(review: ScenarioReview) {
    if (!authToken) {
      setAuthError("리뷰 작성은 로그인 후 사용할 수 있습니다.");
      setView("login");
      return false;
    }

    try {
      await authedRequest<{ reviewId: number }>(
        `/api/scenarios/${review.scenarioId}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            rating: Math.round(review.rating),
            content: review.body,
            isSpoiler: review.isSpoiler,
          }),
        },
      );
      await loadScenarioReviews(review.scenarioId);
      await loadScenarios();
      setScenarioDetailError(null);
      return true;
    } catch (error) {
      setScenarioDetailError(
        error instanceof Error ? error.message : "리뷰를 등록하지 못했습니다.",
      );
      return false;
    }
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

  async function saveCompletedRecord(finalResult: Result) {
    await upsertRecord({
      recordId: `session-${finalResult.sessionId || sessionId || Date.now()}`,
      sessionId: finalResult.sessionId || sessionId || undefined,
      scenarioId: dashboard?.scenarioId ?? selectedScenario?.scenarioId,
      scenarioTitle:
        dashboard?.scenarioTitle ?? selectedScenario?.title ?? "완료한 사건",
      status: "COMPLETED",
      score: finalResult.score,
      grade: finalResult.grade,
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  }

  async function loadScenarios(filter = scenarioFilter) {
    setScenarioLoading(true);
    setScenarioLoadingMore(false);
    setScenarioError(null);
    try {
      const data = await optionalAuthRequest<
        ScenarioPagePayload | Record<string, unknown>[]
      >("/api/scenarios", { query: buildScenarioQuery(filter, 0) });
      const pageData = normalizeScenarioPage(data, 0);
      setScenarios(pageData.scenarios);
      setScenarioPage(pageData.page);
      setScenarioHasNext(pageData.hasNext);
      setBookmarkedScenarioIds((current) => {
        const visibleIds = new Set(
          pageData.scenarios.map((scenario) => scenario.scenarioId),
        );
        const bookmarkedIds = pageData.scenarios
          .filter((scenario) => scenario.isBookmarked === true)
          .map((scenario) => scenario.scenarioId);
        const retained = current.filter(
          (scenarioId) => !visibleIds.has(scenarioId),
        );
        return [...new Set([...retained, ...bookmarkedIds])];
      });
    } catch (error) {
      setScenarioError(
        error instanceof Error
          ? error.message
          : "시나리오를 불러오지 못했습니다.",
      );
    } finally {
      setScenarioLoading(false);
    }
  }

  async function loadMoreScenarios() {
    if (scenarioLoading || scenarioLoadingMore || !scenarioHasNext) return;
    const nextPage = scenarioPage + 1;
    setScenarioLoadingMore(true);
    setScenarioError(null);
    try {
      const data = await optionalAuthRequest<
        ScenarioPagePayload | Record<string, unknown>[]
      >("/api/scenarios", {
        query: buildScenarioQuery(scenarioFilter, nextPage),
      });
      const pageData = normalizeScenarioPage(data, nextPage);
      setScenarios((current) => {
        const seen = new Set(current.map((scenario) => scenario.scenarioId));
        return [
          ...current,
          ...pageData.scenarios.filter(
            (scenario) => !seen.has(scenario.scenarioId),
          ),
        ];
      });
      setScenarioPage(pageData.page);
      setScenarioHasNext(pageData.hasNext);
      setBookmarkedScenarioIds((current) => {
        const visibleIds = new Set(
          pageData.scenarios.map((scenario) => scenario.scenarioId),
        );
        const bookmarkedIds = pageData.scenarios
          .filter((scenario) => scenario.isBookmarked === true)
          .map((scenario) => scenario.scenarioId);
        const retained = current.filter(
          (scenarioId) => !visibleIds.has(scenarioId),
        );
        return [...new Set([...retained, ...bookmarkedIds])];
      });
    } catch (error) {
      setScenarioError(
        error instanceof Error
          ? error.message
          : "시나리오를 더 불러오지 못했습니다.",
      );
    } finally {
      setScenarioLoadingMore(false);
    }
  }

  async function loadBookmarkedScenarios() {
    if (!authToken) {
      setAuthError("저장한 사건은 로그인 후 사용할 수 있습니다.");
      setView("login");
      return;
    }

    setBookmarksLoading(true);
    setBookmarksError(null);
    setView("bookmarks");
    try {
      const data = await authedRequest<
        { content?: Record<string, unknown>[] } | Record<string, unknown>[]
      >("/api/scenarios/bookmarked", { query: { page: 0, size: 30 } });
      const list = Array.isArray(data) ? data : (data.content ?? []);
      const normalized = list
        .map(normalizeScenario)
        .map((scenario) => ({ ...scenario, isBookmarked: true }));
      setBookmarkedScenarios(normalized);
      setBookmarkedScenarioIds((current) => [
        ...new Set([
          ...current,
          ...normalized.map((scenario) => scenario.scenarioId),
        ]),
      ]);
    } catch (error) {
      setBookmarksError(
        error instanceof Error
          ? error.message
          : "저장한 사건을 불러오지 못했습니다.",
      );
    } finally {
      setBookmarksLoading(false);
    }
  }

  function applyScenarioFilter(next: ScenarioFilterState) {
    setScenarioFilter(next);
    void loadScenarios(next);
  }

  async function openScenarioDetail(
    scenario: Scenario,
    backView: View = "library",
  ) {
    setSelectedScenario(scenario);
    setScenarioDetailBackView(backView);
    setScenarioDetailError(null);
    setView("scenarioDetail");
    setScenarioDetailLoading(true);
    try {
      const detail = await optionalAuthRequest<Record<string, unknown>>(
        `/api/scenarios/${scenario.scenarioId}`,
      );
      const normalizedDetail = normalizeScenario(detail);
      const nextScenario = {
        ...scenario,
        ...normalizedDetail,
        thumbnailUrl: normalizedDetail.thumbnailUrl ?? scenario.thumbnailUrl,
      };
      setSelectedScenario(nextScenario);
      setBookmarkedScenarioIds((current) => {
        const withoutCurrent = current.filter(
          (scenarioId) => scenarioId !== nextScenario.scenarioId,
        );
        return nextScenario.isBookmarked
          ? [nextScenario.scenarioId, ...withoutCurrent]
          : withoutCurrent;
      });
      void loadScenarioReviews(nextScenario.scenarioId);
    } catch (error) {
      setScenarioDetailError(
        error instanceof Error
          ? error.message
          : "시나리오 상세를 불러오지 못했습니다.",
      );
    } finally {
      setScenarioDetailLoading(false);
    }
  }

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

  async function pollResult(id: number) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const data = await authedRequest<unknown>(
          `/api/play-sessions/${id}/result`,
        );
        return normalizeResult(data);
      } catch (error) {
        lastError = error;
        await delay(1500);
      }
    }
    throw lastError;
  }

  async function submitDeduction() {
    if (!sessionId || !authToken || !selectedCulpritId || submitting) return;
    if (
      motiveText.trim().length < MIN_DEDUCTION_TEXT_LENGTH ||
      methodText.trim().length < MIN_DEDUCTION_TEXT_LENGTH ||
      coverUpText.trim().length < MIN_DEDUCTION_TEXT_LENGTH
    ) {
      return;
    }
    if (selectedEvidenceIds.length < 1 || selectedEvidenceIds.length > 15) {
      return;
    }

    setSubmitting(true);
    setCaseError(null);
    let resultSubmitted = false;
    try {
      await authedRequest<unknown>(
        `/api/play-sessions/${sessionId}/final-deduction`,
        {
          method: "POST",
          body: JSON.stringify({
            selectedCulpritId,
            motiveText,
            methodText,
            coverUpText,
            selectedEvidenceIds,
          }),
        },
      );
      resultSubmitted = true;
      setPendingResultSessionId(sessionId);
      const finalResult = await pollResult(sessionId);
      setResult(finalResult);
      setPendingResultSessionId(null);
      await saveCompletedRecord(finalResult);
      setView("result");
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.code === "AI010" || error.status === 409)
      ) {
        resultSubmitted = true;
        setPendingResultSessionId(sessionId);
        try {
          const finalResult = await pollResult(sessionId);
          setResult(finalResult);
          setPendingResultSessionId(null);
          await saveCompletedRecord(finalResult);
          setView("result");
        } catch (resultError) {
          setCaseError(
            resultError instanceof Error
              ? resultError.message
              : "제출은 완료됐지만 결과를 아직 불러오지 못했습니다.",
          );
        }
      } else {
        setCaseError(
          resultSubmitted
            ? "최종 추리는 제출됐지만 결과를 아직 불러오지 못했습니다. 잠시 후 다시 확인해 주세요."
            : error instanceof Error
              ? error.message
              : "최종 추리 제출에 실패했습니다.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function retryResultLoad() {
    if (!pendingResultSessionId || submitting) return;
    setSubmitting(true);
    setCaseError(null);
    try {
      const finalResult = await pollResult(pendingResultSessionId);
      setResult(finalResult);
      setPendingResultSessionId(null);
      await saveCompletedRecord(finalResult);
      setView("result");
    } catch (error) {
      setCaseError(
        error instanceof Error
          ? error.message
          : "제출은 완료됐지만 결과를 아직 불러오지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function openResultForSession(id: number) {
    if (submitting) return;
    setSubmitting(true);
    setCaseError(null);
    setPendingResultSessionId(id);
    try {
      const finalResult = await pollResult(id);
      setResult(finalResult);
      setPendingResultSessionId(null);
      await saveCompletedRecord(finalResult);
      setView("result");
    } catch (error) {
      setCaseError(
        error instanceof Error
          ? error.message
          : "결과를 아직 불러오지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
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
  const resumableRecord = useMemo(
    () => records.find((record) => record.status === "IN_PROGRESS"),
    [records],
  );
  const currentReviewTarget =
    dashboard != null
      ? { scenarioId: dashboard.scenarioId, title: dashboard.scenarioTitle }
      : selectedScenario
        ? {
            scenarioId: selectedScenario.scenarioId,
            title: selectedScenario.title,
          }
        : null;

  function openProfile() {
    if (!tokens) {
      setView("login");
      return;
    }
    void loadProfile();
    setView("profile");
  }

  function scenarioFromRecord(record: RecordItem): Scenario | null {
    if (!record.scenarioId) return null;
    return (
      scenarios.find(
        (scenario) => scenario.scenarioId === record.scenarioId,
      ) ?? {
        scenarioId: record.scenarioId,
        title: record.scenarioTitle,
        description: "",
        difficulty: "NORMAL",
        scenarioType: "OFFICIAL",
        estimatedPlayTimeMinutes: 0,
        suspectCount: 0,
        evidenceCount: 0,
        averageRating: 0,
        playCount: 0,
        canPlay: true,
      }
    );
  }

  async function resumeRecord(record: RecordItem) {
    const scenario = scenarioFromRecord(record);
    if (!scenario) {
      setView("library");
      return;
    }
    setSelectedScenario(scenario);
    await startSession(scenario);
  }

  if (!authReady) {
    return (
      <Shell title="ClueRoom">
        <StateBlock title="앱을 준비하고 있습니다" />
      </Shell>
    );
  }

  // 앱 셸 하단 네비 탭 → view 매핑 (Flutter app_shell.dart, 만들기 제외 4탭).
  // 비-탭 화면(상세/게임/로그인 등)은 navIndex === -1 → 네비 미표시 + topbar 유지.
  const APP_NAV_VIEWS: View[] = ["home", "library", "records", "profile"];
  const navIndex = APP_NAV_VIEWS.indexOf(view);

  return (
    <Shell
      title="ClueRoom"
      bare={
        view === "home" ||
        view === "scenarioDetail" ||
        view === "login" ||
        view === "briefing" ||
        view === "case" ||
        view === "chat" ||
        view === "evidenceDetail" ||
        view === "suspectDetail" ||
        view === "submit" ||
        view === "result" ||
        view === "bookmarks"
      }
      nav={
        navIndex === -1
          ? undefined
          : {
              currentIndex: navIndex,
              onTap: (index) => {
                // 기존 진입점과 동일하게 동작 보존(openProfile/records 는 자체 로그인 게이팅).
                const target = APP_NAV_VIEWS[index];
                if (target === "profile") openProfile();
                else if (target === "records")
                  setView(tokens ? "records" : "login");
                else setView(target);
              },
            }
      }
      onHome={() => setView("home")}
      onLibrary={() => setView("library")}
      onProfile={tokens ? openProfile : undefined}
      onLogout={tokens ? logout : undefined}
    >
      {view === "login" && (
        <LoginScreen
          error={authError}
          onGoogleCredential={handleGoogleCredential}
          onAuthError={setAuthError}
          onDevLogin={handleDevLogin}
        />
      )}

      {view === "home" && (
        <HomeScreen
          isLoggedIn={!!tokens}
          onLogin={() => setView("login")}
          onBrowse={() => setView("library")}
          onProfile={openProfile}
          onRecords={() => setView(tokens ? "records" : "login")}
          onResume={() => {
            if (sessionId) setView("case");
            else if (resumableRecord) void resumeRecord(resumableRecord);
          }}
          hasSession={!!sessionId || !!resumableRecord}
        />
      )}

      {view === "profile" && (
        <ProfileScreen
          profile={profile}
          loading={profileLoading}
          error={profileError}
          onRefresh={loadProfile}
          onBookmarks={() => void loadBookmarkedScenarios()}
          onLogout={logout}
        />
      )}

      {view === "records" && (
        <RecordsScreen
          records={records}
          onResume={(record) => void resumeRecord(record)}
        />
      )}

      {view === "library" && (
        <LibraryScreen
          scenarios={scenarios}
          filter={scenarioFilter}
          loading={scenarioLoading}
          loadingMore={scenarioLoadingMore}
          hasNext={scenarioHasNext}
          error={scenarioError}
          onRefresh={() => loadScenarios()}
          onLoadMore={() => void loadMoreScenarios()}
          onFilterChange={applyScenarioFilter}
          onSelect={openScenarioDetail}
        />
      )}

      {view === "bookmarks" && (
        <BookmarksScreen
          scenarios={bookmarkedScenarios}
          loading={bookmarksLoading}
          error={bookmarksError}
          onBack={() => setView("profile")}
          onRefresh={() => void loadBookmarkedScenarios()}
          onLibrary={() => setView("library")}
          onSelect={(scenario) => void openScenarioDetail(scenario, "bookmarks")}
        />
      )}

      {view === "scenarioDetail" && selectedScenario && (
        <ScenarioDetailScreen
          scenario={selectedScenario}
          bookmarked={bookmarkedScenarioIds.includes(
            selectedScenario.scenarioId,
          )}
          reviews={scenarioReviews.filter(
            (review) => review.scenarioId === selectedScenario.scenarioId,
          )}
          loading={scenarioDetailLoading}
          error={scenarioDetailError}
          onBack={() => setView(scenarioDetailBackView)}
          onStart={() => setView("briefing")}
          onToggleBookmark={() =>
            void toggleScenarioBookmark(selectedScenario.scenarioId)
          }
          onWriteReview={() =>
            setReviewDraftTarget({
              scenarioId: selectedScenario.scenarioId,
              title: selectedScenario.title,
            })
          }
          onOpenImage={(preview) => setImagePreview(preview)}
        />
      )}

      {view === "briefing" && selectedScenario && (
        <CaseBriefingScreen
          scenario={selectedScenario}
          loading={caseLoading}
          onBack={() => setView("scenarioDetail")}
          onStart={() => startSession(selectedScenario)}
        />
      )}

      {view === "case" && (
        <CaseHubScreen
          caseTab={caseTab}
          setCaseTab={setCaseTab}
          dashboard={dashboard}
          evidences={evidences}
          suspects={suspects}
          timeline={timeline}
          locations={locations}
          mapImageUrl={caseMapImageUrl}
          hints={hints}
          loading={caseLoading}
          error={caseError}
          onRetry={() => loadCase()}
          onEvidenceDetail={openEvidenceDetail}
          onSuspectDetail={openSuspectDetail}
          onOpenImage={(preview) => setImagePreview(preview)}
          onUseHint={useHint}
          onAbandon={abandonSession}
          onSubmit={() => setView("submit")}
          onResult={(id) => void openResultForSession(id)}
        />
      )}

      {view === "evidenceDetail" && selectedEvidence && (
        <EvidenceDetailScreen
          evidence={selectedEvidence}
          suspects={suspects}
          evidences={evidences}
          loading={evidenceDetailLoading}
          error={evidenceDetailError}
          onBack={() => setView("case")}
          onOpenImage={(preview) => setImagePreview(preview)}
          onCompareEvidence={(evidenceId) => {
            const target = evidences.find((e) => e.evidenceId === evidenceId);
            if (target) void openEvidenceDetail(target);
          }}
          onChat={openChat}
        />
      )}

      {view === "suspectDetail" && selectedSuspect && (
        <SuspectDetailScreen
          suspect={selectedSuspect}
          evidences={evidences}
          logs={suspectLogs}
          loading={suspectDetailLoading}
          onBack={() => setView("case")}
          onChat={() => openChat(selectedSuspect)}
          onSelectCulprit={() => {
            setSelectedCulpritId(selectedSuspect.suspectId);
            setView("submit");
          }}
          onEvidenceDetail={openEvidenceDetail}
        />
      )}

      {view === "chat" && chatSuspect && (
        <InterrogationChatScreen
          suspect={chatSuspect}
          messages={messages}
          question={question}
          setQuestion={(value) => {
            setQuestion(value);
            if (pendingQuestionType === "RECOMMENDED") {
              setPendingQuestionType("FREE");
            }
          }}
          pendingEvidence={evidences.find(
            (e) => e.evidenceId === pendingEvidenceId,
          )}
          evidences={unlockedEvidences}
          loading={chatLoading}
          onBack={() => setView("case")}
          onPrefill={(q) => {
            setQuestion(q);
            setPendingQuestionType("RECOMMENDED");
          }}
          onAttachEvidence={(evidenceId) => {
            setPendingEvidenceId(evidenceId);
            setPendingQuestionType("EVIDENCE_PRESENTED");
          }}
          onClearEvidence={() => {
            setPendingEvidenceId(null);
            setPendingQuestionType("FREE");
          }}
          onSend={sendQuestion}
        />
      )}

      {view === "submit" && (
        <SubmitScreen
          suspects={accusableSuspects}
          evidences={unlockedEvidences}
          selectedCulpritId={selectedCulpritId}
          setSelectedCulpritId={setSelectedCulpritId}
          selectedEvidenceIds={selectedEvidenceIds}
          setSelectedEvidenceIds={setSelectedEvidenceIds}
          motiveText={motiveText}
          setMotiveText={setMotiveText}
          methodText={methodText}
          setMethodText={setMethodText}
          coverUpText={coverUpText}
          setCoverUpText={setCoverUpText}
          submitting={submitting}
          error={caseError}
          pendingResult={!!pendingResultSessionId}
          onBack={() => setView("case")}
          onSubmit={submitDeduction}
          onRetryResult={retryResultLoad}
        />
      )}

      {view === "result" && (
        <ResultScreen
          result={result}
          onHome={() => setView("home")}
          onLibrary={() => setView("library")}
          onWriteReview={
            currentReviewTarget
              ? () => setReviewDraftTarget(currentReviewTarget)
              : undefined
          }
        />
      )}
      {imagePreview && (
        <ImageViewer
          preview={imagePreview}
          onClose={() => setImagePreview(null)}
        />
      )}
      {reviewDraftTarget && (
        <ReviewDialog
          target={reviewDraftTarget}
          authorName={profile?.nickname ?? "나"}
          onCancel={() => setReviewDraftTarget(null)}
          onSubmit={(review) => {
            void addScenarioReview(review).then((saved) => {
              if (saved) setReviewDraftTarget(null);
            });
          }}
        />
      )}
    </Shell>
  );
}

function Shell({
  children,
  title,
  onHome,
  onLibrary,
  onProfile,
  onLogout,
  bare = false,
  nav,
}: {
  children: React.ReactNode;
  title: string;
  onHome?: () => void;
  onLibrary?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  bare?: boolean;
  /** 탭 화면이면 하단 네비를 표시(+topbar 제거). 정본 app_shell.dart. */
  nav?: { currentIndex: number; onTap: (index: number) => void };
}) {
  // 탭 화면: topbar 없이 하단 네비로 이동(Flutter 탭 화면엔 앱바 없음). bare(home)면 main 패딩 0.
  if (nav) {
    return (
      <div className="app-frame app-frame--tabbed">
        <main style={bare ? { padding: 0 } : undefined}>{children}</main>
        <BottomNav
          items={APP_NAV_ITEMS}
          currentIndex={nav.currentIndex}
          onTap={nav.onTap}
        />
      </div>
    );
  }
  if (bare) {
    return (
      <div className="app-frame">
        <main style={{ padding: 0 }}>{children}</main>
      </div>
    );
  }
  return (
    <div className="app-frame">
      <header className="topbar">
        <button className="brand" onClick={onHome} type="button">
          <span className="brand-mark">CR</span>
          <span>{title}</span>
        </button>
        <div className="topbar-actions">
          {onLibrary && (
            <button
              className="icon-button"
              onClick={onLibrary}
              type="button"
              title="사건"
            >
              사건
            </button>
          )}
          {onProfile && (
            <button
              className="icon-button"
              onClick={onProfile}
              type="button"
              title="내 정보"
            >
              내 정보
            </button>
          )}
          {onLogout && (
            <button
              className="icon-button"
              onClick={onLogout}
              type="button"
              title="로그아웃"
            >
              로그아웃
            </button>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function ReviewDialog({
  target,
  authorName,
  onCancel,
  onSubmit,
}: {
  target: ReviewDraftTarget;
  authorName: string;
  onCancel: () => void;
  onSubmit: (review: ScenarioReview) => void;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const canSubmit = body.trim().length > 0;

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <button
        className="modal-backdrop"
        onClick={onCancel}
        type="button"
        aria-label="닫기"
      />
      <div className="review-dialog">
        <div className="modal-handle" />
        <p className="eyebrow">REVIEW</p>
        <h2>{target.title}</h2>
        <label className="field-label" htmlFor="review-rating">
          평점 {rating}점
        </label>
        <input
          id="review-rating"
          type="range"
          min="1"
          max="5"
          step="1"
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
        />
        <TextArea label="리뷰" value={body} onChange={setBody} />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={isSpoiler}
            onChange={(event) => setIsSpoiler(event.target.checked)}
          />
          <span>스포일러 포함</span>
        </label>
        <div className="dialog-actions">
          <button className="button ghost" onClick={onCancel} type="button">
            취소
          </button>
          <button
            className="button primary"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                reviewId: `review-${Date.now()}`,
                scenarioId: target.scenarioId,
                authorName,
                rating,
                body: body.trim(),
                createdAt: new Date().toISOString(),
                isSpoiler,
              })
            }
            type="button"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-area">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function StateBlock({
  title,
  body,
  action,
  actionLabel = "다시 시도",
}: {
  title: string;
  body?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <div className="state-icon">CR</div>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action && (
        <button className="button secondary" onClick={action} type="button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ImageViewer({
  preview,
  onClose,
}: {
  preview: ImagePreview;
  onClose: () => void;
}) {
  return (
    <div className="image-viewer" role="dialog" aria-modal="true">
      <button
        className="image-viewer-backdrop"
        onClick={onClose}
        type="button"
        aria-label="닫기"
      />
      <div className="image-viewer-panel">
        <div className="image-viewer-topbar">
          <div>
            <p className="eyebrow">{preview.subtitle ?? "IMAGE"}</p>
            <h2>{preview.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            닫기
          </button>
        </div>
        <img src={preview.url} alt={preview.title} />
      </div>
    </div>
  );
}

export default App;
