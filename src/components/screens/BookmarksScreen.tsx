import { ArrowLeft, Bookmark, CloudOff } from "lucide-react";
import { Button, Empty, Kicker, ListSkeleton } from "../ui";
import { ScenarioRow } from "../domain";
import type { Scenario } from "../../types";
import styles from "./BookmarksScreen.module.css";

// 픽셀 정본: 전용 화면 없음 — 북마크는 Flutter 에서 scenario_detail 의 토글뿐(SharedPreferences).
//   koo 확정(2026-06-20): bare 단일 화면(자체 AppBar back + 페이지 스크롤) + 라이브러리 _ScenarioRow
//   카드 재사용. 웹 서버 북마크 데이터/동작은 보존(loading/error/empty + onSelect/onRefresh/onLibrary).
//
//   레이아웃 = 상세/브리핑과 동일 bare 레시피: 100dvh flex + sticky AppBar(페이지 스크롤).
//   카드 = domain/ScenarioRow(라이브러리와 1:1 동일 픽셀).

export interface BookmarksScreenProps {
  scenarios: Scenario[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRefresh: () => void;
  onLibrary: () => void;
  onSelect: (scenario: Scenario) => void;
}

export function BookmarksScreen({
  scenarios,
  loading,
  error,
  onBack,
  onRefresh,
  onLibrary,
  onSelect,
}: BookmarksScreenProps) {
  const hasResults = scenarios.length > 0;

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
        <span className={styles.barTitle}>SAVED CASES</span>
      </header>

      <div className={styles.scroll}>
        <div className={styles.listHead}>
          <Kicker label="저장한 사건" className={styles.kickerGrow} />
          <span className={styles.count}>
            {loading ? "동기화 중" : `${scenarios.length}건`}
          </span>
        </div>

        {loading ? (
          <ListSkeleton itemCount={5} itemHeight={96} />
        ) : error ? (
          <Empty
            icon={CloudOff}
            title="불러오지 못했습니다"
            subtitle={error}
            action={
              <Button label="다시 시도" variant="secondary" onPress={onRefresh} />
            }
          />
        ) : !hasResults ? (
          <Empty
            icon={Bookmark}
            title="아직 저장한 사건이 없습니다"
            subtitle="사건 상세에서 저장을 누르면 이 목록에 추가됩니다."
            action={
              <Button label="사건 보러가기" variant="secondary" onPress={onLibrary} />
            }
          />
        ) : (
          <ul className={styles.list}>
            {scenarios.map((scenario) => (
              <li key={scenario.scenarioId}>
                <ScenarioRow
                  scenario={scenario}
                  onPress={() => onSelect(scenario)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
