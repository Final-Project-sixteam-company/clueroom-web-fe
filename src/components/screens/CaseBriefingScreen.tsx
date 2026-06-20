import { ArrowLeft } from "lucide-react";
import { Button, Kicker } from "../ui";
import type { Scenario } from "../../types";
import styles from "./CaseBriefingScreen.module.css";

// 픽셀 정본: lib/screens/case_briefing_screen.dart
//   AppBar(back + 'CASE BRIEFING' monoLabel) → 본문(sp4): 5섹션 stagger 페이드인
//     [0] 제목(display) → [1] 사건 개요(Kicker+synopsis) → [2] 피해자 정보(_VictimRow) →
//     [3] 탐정 목표(danger 박스) → [4] 하단 '수사 시작하기' 버튼.
//
// 충실도 방침(koo #4): 픽셀=Flutter 레이아웃, 데이터/동작=웹 보존.
//   · 피해자 상세는 세션 시작 후 dashboard.briefing 으로만 옴 → 세션 전 브리핑은 정본대로
//     placeholder('미상' / '수사 시작 후 공개') 표시(스포일러 방지). 위치 라벨만 scenario.tags[0].
//   · 탐정 목표 3줄은 Flutter 하드코딩 정본 그대로.
//   · 동작: '수사 시작하기' → onStart(App.startSession). startSession 은 비동기(성공 시 case 뷰로
//     전환, 실패 시 브리핑 잔류)라 버튼 로딩은 App 의 caseLoading 을 loading prop 으로 받아 표현
//     (Flutter _starting 대응 — 실패 시 caseLoading=false 로 자동 복구).
//   · 레이아웃 = 상세 화면과 동일 bare 레시피: 100dvh flex + sticky AppBar/footer(페이지 스크롤).
//   · 진입 모션: Flutter 의 순차 await(80*i 누적) 스태거 → 누적 시작시각 [0,80,240,480,800]ms 재현.

// Flutter _playSequential 의 순차 await(80*i)로 인한 누적 시작 시각(ms). dur3(320) easeOut.
const SECTION_DELAYS = [0, 80, 240, 480, 800] as const;

export interface CaseBriefingScreenProps {
  scenario: Scenario;
  /** App.caseLoading — 세션 시작 진행 중 버튼 로딩(Flutter _starting). */
  loading: boolean;
  onBack: () => void;
  onStart: () => void;
}

export function CaseBriefingScreen({
  scenario,
  loading,
  onBack,
  onStart,
}: CaseBriefingScreenProps) {
  const synopsis =
    scenario.synopsis || scenario.description || "사건 개요를 확인하세요.";
  // Flutter: scenario.tags.firstOrNull ?? '현장'.
  const locationLabel = scenario.tags?.[0] ?? "현장";

  return (
    <section className={styles.screen}>
      <header className={styles.bar}>
        <button
          type="button"
          className={styles.barBtn}
          onClick={onBack}
          aria-label="뒤로"
        >
          <ArrowLeft size={24} strokeWidth={2} aria-hidden />
        </button>
        <span className={styles.barTitle}>CASE BRIEFING</span>
      </header>

      <div className={styles.scroll}>
        <h1
          className={`${styles.section} ${styles.title}`}
          style={{ animationDelay: `${SECTION_DELAYS[0]}ms` }}
        >
          {scenario.title}
        </h1>

        <section
          className={styles.section}
          style={{ animationDelay: `${SECTION_DELAYS[1]}ms` }}
        >
          <Kicker label="사건 개요" className={styles.kicker} />
          <p className={styles.body}>{synopsis}</p>
        </section>

        <section
          className={styles.section}
          style={{ animationDelay: `${SECTION_DELAYS[2]}ms` }}
        >
          <Kicker label="피해자 정보" className={styles.kicker} />
          <VictimRow locationLabel={locationLabel} />
        </section>

        <section
          className={styles.section}
          style={{ animationDelay: `${SECTION_DELAYS[3]}ms` }}
        >
          <Kicker label="탐정 목표" className={styles.kicker} />
          <div className={styles.goals}>
            {"1. 진범을 찾아라\n2. 살해 방법과 동기를 밝혀라\n3. 최종 추리를 뒷받침할 증거를 확보하라"}
          </div>
        </section>
      </div>

      <footer
        className={`${styles.section} ${styles.footer}`}
        style={{ animationDelay: `${SECTION_DELAYS[4]}ms` }}
      >
        <Button
          label="수사 시작하기"
          expanded
          loading={loading}
          onPress={loading ? undefined : onStart}
        />
      </footer>
    </section>
  );
}

// ── 피해자 요약 행 (_VictimRow) — 세션 전 placeholder ────────────────────────────
function VictimRow({ locationLabel }: { locationLabel: string }) {
  return (
    <div className={styles.victim}>
      <span className={styles.victimAvatar} aria-hidden>
        ?
      </span>
      <div className={styles.victimMeta}>
        <span className={styles.victimName}>미상</span>
        <span className={styles.victimRole}>
          피해자 정보는 수사 시작 후 공개됩니다
        </span>
      </div>
      <span className={styles.victimLocation}>{locationLabel}</span>
    </div>
  );
}
