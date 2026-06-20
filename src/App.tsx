import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { SplashScreen } from "./components/screens/SplashScreen";
import { OnboardingScreen } from "./components/screens/OnboardingScreen";
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
import { ReviewWriteSheet } from "./components/screens/ReviewWriteSheet";
import { BottomNav, APP_NAV_ITEMS } from "./components/ui";
import { MIN_DEDUCTION_TEXT_LENGTH, SPLASH_DURATION_MS } from "./config/env";
import {
  hasSeenOnboarding,
  markOnboardingSeen,
} from "./onboarding/onboardingStorage";
import type { View, RecordItem, ImagePreview, Scenario, AiQuotaStatus } from "./types";
import { useRecords } from "./records/useRecords";
import { useScenarios } from "./scenarios/useScenarios";
import { useGameSession } from "./game/useGameSession";
import { useResult } from "./result/useResult";
import { ApiError } from "./api/ApiError";
import { useAuth } from "./auth/useAuth";

function App() {
  const [view, setView] = useState<View>("splash");
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);

  // 로그아웃 시 게임 상태 리셋은 useGameSession 소유 — 훅이 useAuth 뒤에 오므로 ref 로 연결.
  const resetGameRef = useRef<() => void>(() => {});

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
      resetGameRef.current();
      setView("login");
    },
  });

  // Records 도메인 — 상태 + load/persist 스파인은 useRecords 소유.
  // saveCompletedRecord 의 교차도메인 메타(sessionId/scenario)는 호출 시점에 주입.
  const { records, saveInProgressRecord, saveCompletedRecord } = useRecords({
    authReady,
    authToken,
    authedRequest,
  });
  const accountKey = profile
    ? String(profile.userId ?? profile.email ?? `${profile.provider ?? "USER"}:${profile.nickname}`)
    : authToken
      ? "authenticated"
      : null;

  // Scenarios 도메인 — 라이브러리/상세/북마크/리뷰 상태 + 로더는 useScenarios 소유.
  // 인증 안내(setAuthError)·화면 전환(setView)은 주입해 함수의 인라인 네비를 1:1 보존.
  const {
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
  } = useScenarios({
    authReady,
    authToken,
    accountKey,
    authedRequest,
    optionalAuthRequest,
    setAuthError,
    setView,
  });

  // Game-session 도메인 — 사건/증거/용의자/타임라인/심문/제출 폼 상태 + 게임 로직은
  // useGameSession 소유(회귀 민감 폴링 30초·1초 타이머 포함). 결과 흐름은 App 오케스트레이터.
  const {
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
  } = useGameSession({
    view,
    authToken,
    authedRequest,
    setView,
    saveInProgressRecord,
  });
  resetGameRef.current = resetGameSession;

  // Result 도메인 — 결과 상태 + 폴링(pollResult)은 useResult 소유. 제출/재시도 오케스트레이션은
  // 게임 폼·세션·기록을 교차로 읽으므로 아래 App 함수(submitDeduction 등)가 글루 역할.
  const {
    submitting,
    setSubmitting,
    pendingResultSessionId,
    setPendingResultSessionId,
    result,
    setResult,
    pollResult,
  } = useResult({ authedRequest });

  // 부트(정본 splash_screen.dart): 스플래시를 최소 2.2s 노출한 뒤 authReady 가 되면
  // 온보딩 여부로 분기(미시청→onboarding, 시청→home). authReady 대기 = 로그인/홈 상태가
  // 정해진 뒤 라우팅해 깜빡임 방지. (Flutter 는 미로그인 시 login 이지만 웹 home 은 미로그인도
  // 열려 있어 koo #4(동작 보존)대로 home 으로 — login 강제는 한 줄로 뒤집기 가능.)
  const [splashElapsed, setSplashElapsed] = useState(false);
  const splashRoutedRef = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setSplashElapsed(true),
      SPLASH_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (
      view !== "splash" ||
      !splashElapsed ||
      !authReady ||
      splashRoutedRef.current
    ) {
      return;
    }
    splashRoutedRef.current = true;
    void hasSeenOnboarding().then((seen) =>
      setView(seen ? "home" : "onboarding"),
    );
  }, [view, splashElapsed, authReady]);

  async function handleOnboardingComplete() {
    await markOnboardingSeen();
    setView("home");
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
      await saveCompletedRecord(finalResult, {
        sessionId,
        scenarioId: dashboard?.scenarioId ?? selectedScenario?.scenarioId,
        scenarioTitle: dashboard?.scenarioTitle ?? selectedScenario?.title,
      });
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
          await saveCompletedRecord(finalResult, {
            sessionId,
            scenarioId: dashboard?.scenarioId ?? selectedScenario?.scenarioId,
            scenarioTitle: dashboard?.scenarioTitle ?? selectedScenario?.title,
          });
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
      await saveCompletedRecord(finalResult, {
        sessionId,
        scenarioId: dashboard?.scenarioId ?? selectedScenario?.scenarioId,
        scenarioTitle: dashboard?.scenarioTitle ?? selectedScenario?.title,
      });
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
      await saveCompletedRecord(finalResult, {
        sessionId,
        scenarioId: dashboard?.scenarioId ?? selectedScenario?.scenarioId,
        scenarioTitle: dashboard?.scenarioTitle ?? selectedScenario?.title,
      });
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

  function handleAiQuotaAction(status: AiQuotaStatus) {
    switch (status.recommendedAction) {
      case "OPEN_EVIDENCE_TIMELINE":
        setCaseTab("evidence");
        setView("case");
        return;
      case "OPEN_SUSPECT_TIMELINE_COMPARE":
        setCaseTab("timeline");
        setView("case");
        return;
      case "OPEN_HINT_OR_GUIDANCE":
        setCaseTab("scene");
        setView("case");
        return;
      case "OPEN_FINAL_DEDUCTION_CHECKLIST":
      case "OPEN_FINAL_DEDUCTION":
        setView("submit");
        return;
      default:
        setCaseTab("evidence");
        setView("case");
    }
  }

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

  // 앱 셸 하단 네비 탭 → view 매핑 (Flutter app_shell.dart, 만들기 제외 4탭).
  // 비-탭 화면(상세/게임/로그인 등)은 navIndex === -1 → 네비 미표시 + topbar 유지.
  const APP_NAV_VIEWS: View[] = ["home", "library", "records", "profile"];
  const navIndex = APP_NAV_VIEWS.indexOf(view);

  return (
    <Shell
      title="ClueRoom"
      bare={
        view === "splash" ||
        view === "onboarding" ||
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
      {view === "splash" && <SplashScreen />}

      {view === "onboarding" && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}

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
          quotaStatus={aiQuotaStatus}
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
          onQuotaAction={handleAiQuotaAction}
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
      <ReviewWriteSheet
        open={reviewDraftTarget != null}
        target={reviewDraftTarget}
        authorName={profile?.nickname ?? "나"}
        onClose={() => setReviewDraftTarget(null)}
        onSubmit={(review) => {
          void addScenarioReview(review).then((saved) => {
            if (saved) setReviewDraftTarget(null);
          });
        }}
      />
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
