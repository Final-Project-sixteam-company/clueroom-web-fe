// 정본: lib/screens/case_screen.dart (CaseScreen / _CaseScreenState)
//   얇은 HUD(사건코드·브리핑·타이머·해금증거) + 하단 5탭 네비(현장/증거/용의자/타임라인/제출)
//   + IndexedStack 본문. dashboard==null 로딩/실패/종결 상태는 본문만 교체(HUD·네비는 상시).
// 웹 매핑(koo 확정 2026-06-19):
//   · 제출 = 5번째 네비탭 → onSubmit(App.setView "submit") 푸시(웹 동작 보존, view enum).
//   · 중단 = 좌상단 back → AbandonDialog(kit Modal) → onAbandon(confirm-less, App 소유 abandon).
//   · 브리핑 = HUD 버튼 → kit Modal 임시(정본 CaseBriefingSheet 미이식 → game_modals 슬라이스에서 교체).
//   · 폴링(30초 status-gated)·1초 타이머(loadCaseRef)는 App 소유 — 화면은 dashboard/콜백 props 만 소비.
import { useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Timer,
  FileText,
  CloudOff,
  Gavel,
} from "lucide-react";
import type {
  Dashboard,
  Evidence,
  Suspect,
  TimelineEvent,
  CaseLocation,
  Hint,
  ImagePreview,
} from "../../../types";
import { BottomNav, CASE_NAV_ITEMS, Button, Modal, Spinner, Empty } from "../../ui";
import { formatTime } from "../../../api/normalizers";
import { SceneTab } from "./SceneTab";
import { EvidenceTab } from "./EvidenceTab";
import { SuspectsTab } from "./SuspectsTab";
import { TimelineTab } from "./TimelineTab";
import { CaseBriefingSheet } from "./CaseBriefingSheet";
import styles from "./CaseHubScreen.module.css";

type CaseTab = "scene" | "evidence" | "suspects" | "timeline";
// CASE_NAV_ITEMS 와 동일 순서(현장/증거/용의자/타임라인) + 제출(4)은 별도 view.
const TAB_ORDER: CaseTab[] = ["scene", "evidence", "suspects", "timeline"];
const CLOSED_STATUSES = [
  "SUBMITTED",
  "COMPLETED",
  "ABANDONED",
  "CANCELED",
  "CANCELLED",
  "ENDED",
];

/** 정본 _caseCode: 숫자 시나리오 id → 'CL-XXX'(3자리 0패딩), 없으면 'CL-001'. */
function caseCodeOf(scenarioId?: number): string {
  if (scenarioId == null) return "CL-001";
  return `CL-${String(scenarioId).padStart(3, "0")}`;
}

export interface CaseHubScreenProps {
  caseTab: CaseTab;
  setCaseTab: (tab: CaseTab) => void;
  dashboard: Dashboard | null;
  evidences: Evidence[];
  suspects: Suspect[];
  timeline: TimelineEvent[];
  locations: CaseLocation[];
  mapImageUrl?: string;
  hints: Hint[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEvidenceDetail: (evidence: Evidence) => void;
  onSuspectDetail: (suspect: Suspect) => void;
  onOpenImage: (preview: ImagePreview) => void;
  onUseHint: (hint: Hint) => void;
  /** confirm-less 중단(확인은 이 화면의 AbandonDialog 가 소유). */
  onAbandon: () => void;
  onSubmit: () => void;
  onResult: (sessionId: number) => void;
}

export function CaseHubScreen({
  caseTab,
  setCaseTab,
  dashboard,
  evidences,
  suspects,
  timeline,
  locations,
  mapImageUrl,
  hints,
  loading,
  error,
  onRetry,
  onEvidenceDetail,
  onSuspectDetail,
  onOpenImage,
  onUseHint,
  onAbandon,
  onSubmit,
  onResult,
}: CaseHubScreenProps) {
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);

  const caseCode = caseCodeOf(dashboard?.scenarioId);
  const unlocked = dashboard?.unlockedEvidenceCount ?? 0;
  const total = dashboard?.totalEvidenceCount ?? 0;
  const navIndex = TAB_ORDER.indexOf(caseTab);
  const status = (dashboard?.status ?? "").toUpperCase();
  const isClosed = CLOSED_STATUSES.includes(status);

  function handleNavTap(index: number) {
    // 제출(4) → submit view 푸시(웹). 0~3 은 내부 탭 전환.
    if (index === 4) {
      onSubmit();
      return;
    }
    const next = TAB_ORDER[index];
    if (next) setCaseTab(next);
  }

  let body: React.ReactNode;
  if (loading && !dashboard) {
    // 세션 초기 로딩 — 탭(빈 데이터) 대신 스피너. (정본 MSSpinner 28)
    body = (
      <div className={styles.center}>
        <Spinner size={28} />
      </div>
    );
  } else if (error && !dashboard) {
    // 세션 시작 실패 — 재시도 / 나가기.
    body = (
      <div className={styles.stateWrap}>
        <Empty
          icon={CloudOff}
          title="세션을 시작하지 못했습니다"
          subtitle={error}
          action={<Button label="다시 시도" variant="secondary" onPress={onRetry} />}
          secondaryAction={<Button label="나가기" variant="ghost" onPress={onAbandon} />}
        />
      </div>
    );
  } else if (dashboard && isClosed) {
    // 정답 누출 가드: 종결된 세션은 탭(정답성 데이터) 대신 종결 안내 + 결과 보기.
    body = (
      <div className={styles.stateWrap}>
        <Empty
          icon={Gavel}
          title="이미 종결된 사건입니다"
          subtitle="이 세션은 더 이상 수사 조작을 할 수 없습니다. 결과 화면에서 최종 기록을 확인하세요."
          action={
            <Button label="결과 보기" onPress={() => onResult(dashboard.sessionId)} />
          }
        />
      </div>
    );
  } else if (caseTab === "scene") {
    body = (
      <SceneTab
        locations={locations}
        mapImageUrl={mapImageUrl}
        hints={hints}
        loading={loading}
        onOpenImage={onOpenImage}
        onUseHint={onUseHint}
      />
    );
  } else if (caseTab === "evidence") {
    body = (
      <EvidenceTab
        evidences={evidences}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onEvidenceDetail={onEvidenceDetail}
      />
    );
  } else if (caseTab === "suspects") {
    body = (
      <SuspectsTab
        suspects={suspects}
        dashboard={dashboard}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onSuspectDetail={onSuspectDetail}
      />
    );
  } else {
    body = <TimelineTab timeline={timeline} />;
  }

  return (
    <section className={styles.screen}>
      {/* ── 상단 HUD(정본 _buildHud, 높이 sp10) ── */}
      <header className={styles.hud}>
        <button
          className={styles.backBtn}
          onClick={() => setAbandonOpen(true)}
          aria-label="수사 나가기"
          type="button"
        >
          <ArrowLeft size={20} strokeWidth={2} aria-hidden />
        </button>
        <span className={styles.caseCode}>{caseCode}</span>
        {dashboard && (
          <button
            className={styles.briefingBtn}
            onClick={() => setBriefingOpen(true)}
            type="button"
          >
            <ClipboardList size={20} strokeWidth={2} aria-hidden />
            <span className={styles.briefingLabel}>브리핑</span>
          </button>
        )}
        <span className={styles.spacer} />
        <span className={styles.stat}>
          <Timer size={14} strokeWidth={2} className={styles.iconMute} aria-hidden />
          <span className={styles.timerNum}>
            {formatTime(dashboard?.elapsedSeconds ?? 0)}
          </span>
        </span>
        <span className={`${styles.stat} ${unlocked > 0 ? styles.evGood : ""}`}>
          <FileText size={14} strokeWidth={2} className={styles.evIcon} aria-hidden />
          <span className={styles.evNum}>
            {unlocked}/{total}
          </span>
        </span>
      </header>

      {/* ── 본문(활성 탭 / 로딩·실패·종결 상태) ── */}
      <div className={styles.body}>{body}</div>

      {/* ── 하단 5탭 네비(정본 MSBottomNav, CASE_NAV_ITEMS) ── */}
      <BottomNav
        className={styles.nav}
        items={CASE_NAV_ITEMS}
        currentIndex={navIndex}
        onTap={handleNavTap}
      />

      {/* ── 수사 중단 확인(정본 _AbandonDialog) ── */}
      <Modal
        open={abandonOpen}
        title="수사 중단"
        onClose={() => setAbandonOpen(false)}
        secondaryAction={
          <Button
            label="계속 수사"
            variant="secondary"
            expanded
            onPress={() => setAbandonOpen(false)}
          />
        }
        primaryAction={
          <Button
            label="나가기"
            variant="danger"
            expanded
            onPress={() => {
              setAbandonOpen(false);
              onAbandon();
            }}
          />
        }
      >
        <p className={styles.dialogText}>
          {"지금 나가면 진행 중인 수사가 중단됩니다.\n진행 상황은 저장되지 않으며 다음에 새로 시작해야 합니다."}
        </p>
      </Modal>

      {/* ── 사건 브리핑 재확인(정본 game_modals _BriefingSheet) ── */}
      <CaseBriefingSheet
        open={briefingOpen}
        scenarioTitle={dashboard?.scenarioTitle}
        summary={dashboard?.briefing?.summary}
        victimName={dashboard?.briefing?.victimName}
        foundLocation={dashboard?.briefing?.foundLocation}
        onClose={() => setBriefingOpen(false)}
      />
    </section>
  );
}
