// Scenarios domain hook — owns library list + filter/pagination, scenario detail,
// bookmarks, and reviews. Extracted verbatim from the App god-component
// (Flutter scenario_library/scenario_detail). 데이터/동작은 웹 보존(koo #4).
//
// 주입받는 교차도메인 의존성: authedRequest/optionalAuthRequest(요청 스파인),
// setAuthError(인증 안내 메시지), setView(로그인/북마크/상세 화면 전환).
// 이 함수들이 원래 인라인으로 하던 네비게이션을 그대로 보존하려고 setView 를 주입한다.

import { useEffect, useRef, useState } from "react";

import type {
  Scenario,
  ScenarioFilterState,
  ScenarioPagePayload,
  ScenarioReview,
  ReviewDraftTarget,
  View,
} from "../types";
import {
  normalizeScenario,
  buildScenarioQuery,
  normalizeScenarioPage,
  normalizeReview,
} from "../api/normalizers";
import { ApiError } from "../api/ApiError";
import type { AuthedRequest } from "../auth/useAuth";

export type UseScenariosArgs = {
  authReady: boolean;
  authToken: string | null;
  accountKey: string | null;
  authedRequest: AuthedRequest;
  optionalAuthRequest: AuthedRequest;
  setAuthError: (message: string | null) => void;
  setView: (view: View) => void;
};

export function useScenarios({
  authReady,
  authToken,
  accountKey,
  authedRequest,
  optionalAuthRequest,
  setAuthError,
  setView,
}: UseScenariosArgs) {
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
  const [bookmarkedScenarios, setBookmarkedScenarios] = useState<Scenario[]>([]);
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
  const pendingBookmarkedScenariosRef = useRef(new Map<number, Scenario>());
  const confirmedBookmarkedScenariosRef = useRef(new Map<number, Scenario>());
  const suppressedBookmarkIdsRef = useRef(new Set<number>());

  function persistBookmarks(ids: number[]) {
    const uniqueIds = [...new Set(ids)];
    setBookmarkedScenarioIds(uniqueIds);
  }

  function findScenarioSource(scenarioId: number) {
    return (
      (selectedScenario?.scenarioId === scenarioId ? selectedScenario : null) ??
      scenarios.find((scenario) => scenario.scenarioId === scenarioId) ??
      bookmarkedScenarios.find((scenario) => scenario.scenarioId === scenarioId) ??
      null
    );
  }

  function mergeBookmarkedScenarioList(
    serverScenarios: Scenario[],
    optimisticScenarios: Scenario[] = [],
  ) {
    const byId = new Map<number, Scenario>();
    [...serverScenarios, ...optimisticScenarios].forEach((scenario) => {
      byId.set(scenario.scenarioId, { ...scenario, isBookmarked: true });
    });
    return Array.from(byId.values());
  }

  function mergeScenarioReviews(
    scenarioId: number,
    serverReviews: ScenarioReview[],
    preservedReviews: ScenarioReview[] = [],
  ) {
    const byId = new Map<string, ScenarioReview>();
    serverReviews.forEach((review) => byId.set(review.reviewId, review));
    preservedReviews.forEach((review) => {
      if (!byId.has(review.reviewId)) {
        byId.set(review.reviewId, review);
      }
    });

    setScenarioReviews((current) => [
      ...Array.from(byId.values()),
      ...current.filter((review) => review.scenarioId !== scenarioId),
    ]);
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
    const source = findScenarioSource(scenarioId);
    if (!wasBookmarked && source) {
      suppressedBookmarkIdsRef.current.delete(scenarioId);
      pendingBookmarkedScenariosRef.current.set(scenarioId, {
        ...source,
        isBookmarked: true,
      });
    } else {
      pendingBookmarkedScenariosRef.current.delete(scenarioId);
      confirmedBookmarkedScenariosRef.current.delete(scenarioId);
      suppressedBookmarkIdsRef.current.add(scenarioId);
    }

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
      if (!source || current.some((scenario) => scenario.scenarioId === scenarioId)) {
        return current;
      }
      return [{ ...source, isBookmarked: true }, ...current];
    });

    try {
      await authedRequest(`/api/scenarios/${scenarioId}/bookmarks`, {
        method: wasBookmarked ? "DELETE" : "POST",
      });
      if (!wasBookmarked && source) {
        confirmedBookmarkedScenariosRef.current.set(scenarioId, {
          ...source,
          isBookmarked: true,
        });
      } else {
        confirmedBookmarkedScenariosRef.current.delete(scenarioId);
      }
      setScenarioDetailError(null);
    } catch (error) {
      if (
        error instanceof ApiError &&
        ((error.status === 409 && !wasBookmarked) ||
          (error.status === 404 && wasBookmarked))
      ) {
        if (!wasBookmarked && source) {
          confirmedBookmarkedScenariosRef.current.set(scenarioId, {
            ...source,
            isBookmarked: true,
          });
          suppressedBookmarkIdsRef.current.delete(scenarioId);
        } else {
          confirmedBookmarkedScenariosRef.current.delete(scenarioId);
          suppressedBookmarkIdsRef.current.add(scenarioId);
        }
        setScenarioDetailError(null);
        return;
      }

      pendingBookmarkedScenariosRef.current.delete(scenarioId);
      confirmedBookmarkedScenariosRef.current.delete(scenarioId);
      suppressedBookmarkIdsRef.current.delete(scenarioId);
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
        if (!source || current.some((scenario) => scenario.scenarioId === scenarioId)) {
          return current;
        }
        return [{ ...source, isBookmarked: true }, ...current];
      });
      setScenarioDetailError(
        error instanceof Error ? error.message : "저장 상태를 바꾸지 못했습니다.",
      );
    } finally {
      pendingBookmarkedScenariosRef.current.delete(scenarioId);
    }
  }

  async function loadScenarioReviews(
    scenarioId: number,
    preservedReviews: ScenarioReview[] = [],
  ) {
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
      mergeScenarioReviews(scenarioId, normalized, preservedReviews);
    } catch (error) {
      if (preservedReviews.length > 0) {
        mergeScenarioReviews(scenarioId, [], preservedReviews);
      }
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
      const created = await authedRequest<Record<string, unknown>>(
        `/api/scenarios/${review.scenarioId}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            rating: review.rating,
            content: review.body,
            isSpoiler: review.isSpoiler,
          }),
        },
      );
      const savedReview: ScenarioReview = {
        ...review,
        reviewId: String(created.reviewId ?? created.id ?? review.reviewId),
        createdAt:
          typeof created.createdAt === "string" && created.createdAt.trim()
            ? created.createdAt
            : review.createdAt,
      };
      setScenarioReviews((current) => [
        savedReview,
        ...current.filter(
          (currentReview) =>
            currentReview.scenarioId !== review.scenarioId ||
            currentReview.reviewId !== savedReview.reviewId,
        ),
      ]);
      await loadScenarioReviews(review.scenarioId, [savedReview]);
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
      const normalizedRaw = list
        .map(normalizeScenario)
        .map((scenario) => ({ ...scenario, isBookmarked: true }));
      const serverIds = new Set(
        normalizedRaw.map((scenario) => scenario.scenarioId),
      );
      suppressedBookmarkIdsRef.current.forEach((scenarioId) => {
        if (!serverIds.has(scenarioId)) {
          suppressedBookmarkIdsRef.current.delete(scenarioId);
        }
      });
      const suppressedIds = new Set(suppressedBookmarkIdsRef.current);
      const normalized = normalizedRaw.filter(
        (scenario) => !suppressedIds.has(scenario.scenarioId),
      );
      normalized.forEach((scenario) => {
        confirmedBookmarkedScenariosRef.current.delete(scenario.scenarioId);
      });
      const optimistic = mergeBookmarkedScenarioList(
        Array.from(pendingBookmarkedScenariosRef.current.values()),
        Array.from(confirmedBookmarkedScenariosRef.current.values()),
      ).filter((scenario) => !suppressedIds.has(scenario.scenarioId));
      const merged = mergeBookmarkedScenarioList(normalized, optimistic);
      setBookmarkedScenarios(merged);
      setBookmarkedScenarioIds(merged.map((scenario) => scenario.scenarioId));
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

  useEffect(() => {
    if (authReady) void loadScenarios();
    // Initial library load only; filter changes call applyScenarioFilter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authToken]);

  useEffect(() => {
    pendingBookmarkedScenariosRef.current.clear();
    confirmedBookmarkedScenariosRef.current.clear();
    suppressedBookmarkIdsRef.current.clear();
    setBookmarkedScenarios([]);
    setBookmarkedScenarioIds([]);
  }, [accountKey]);

  return {
    scenarios,
    scenarioFilter,
    bookmarkedScenarioIds,
    bookmarkedScenarios,
    bookmarksLoading,
    bookmarksError,
    scenarioReviews,
    reviewDraftTarget,
    setReviewDraftTarget,
    scenarioLoading,
    scenarioLoadingMore,
    scenarioHasNext,
    scenarioError,
    selectedScenario,
    setSelectedScenario,
    scenarioDetailBackView,
    scenarioDetailLoading,
    scenarioDetailError,
    toggleScenarioBookmark,
    addScenarioReview,
    loadScenarios,
    loadMoreScenarios,
    loadBookmarkedScenarios,
    applyScenarioFilter,
    openScenarioDetail,
  };
}
