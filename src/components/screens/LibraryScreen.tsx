import { useEffect, useRef, useState } from "react";
import { CloudOff, Search, SearchX } from "lucide-react";
import {
  Button,
  Empty,
  FilterChip,
  Kicker,
  ListSkeleton,
  Spinner,
  TextField,
} from "../ui";
import { ScenarioRow } from "../domain";
import type { Scenario, ScenarioFilterState } from "../../types";
import styles from "./LibraryScreen.module.css";

// 픽셀 정본: lib/screens/scenario_library_screen.dart
//   타이틀(시나리오 라이브러리 titleL) → MYSTERY LIBRARY eyebrow → 검색(suffix 돋보기)
//   → 필터 칩 → 구분선 → "사건 목록 ── N건" Kicker → 시나리오 카드 리스트 + 더보기.
//
// 충실도 방침(koo #4): 픽셀=Flutter, 데이터/동작=웹 보존.
//   · 필터: Flutter 는 단일선택 8탭이지만, 웹은 sort/type/difficulty 3축을 "조합"한다
//     (buildScenarioQuery 가 셋을 동시 전송). koo 확정 = 웹 3축 조합 보존 + Flutter 칩 픽셀.
//     → 축별 칩 행(정렬/유형/난이도)을 Flutter FilterChip 픽셀로 렌더(조합 가능).
//   · 검색: Flutter 의 350ms 디바운스를 도입(웹은 기존 Enter/버튼 → 디바운스로 교체).
//   · 카드 썸네일: Flutter 는 48×60 코드 그라디언트. 웹 Scenario 엔 code 가 없고 thumbnailUrl 이 있어
//     이미지 우선 + 타입별 그라디언트 폴백(48×60 프레임/보더/반경은 Flutter 그대로).
//   · 페이지네이션/검색/필터의 서버 흐름(loadScenarios/loadMore/applyFilter)은 App 이 소유 → 콜백 보존.

// 웹 3축 필터 옵션(값=서버 파라미터, 라벨=표시). 정렬은 항상 값이 있고(기본 popular),
// 유형/난이도는 ""(전체) 포함. 이전 인라인 LibraryScreen 의 옵션과 1:1.
const SORT_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["popular", "인기"],
  ["latest", "최신"],
  ["rating", "평점"],
];
const TYPE_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["", "전체"],
  ["OFFICIAL", "공식"],
  ["CUSTOM", "커스텀"],
];
const DIFFICULTY_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["", "전체"],
  ["EASY", "쉬움"],
  ["NORMAL", "보통"],
  ["HARD", "어려움"],
];

export interface LibraryScreenProps {
  scenarios: Scenario[];
  filter: ScenarioFilterState;
  loading: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onFilterChange: (filter: ScenarioFilterState) => void;
  onSelect: (scenario: Scenario) => void;
}

export function LibraryScreen({
  scenarios,
  filter,
  loading,
  loadingMore,
  hasNext,
  error,
  onRefresh,
  onLoadMore,
  onFilterChange,
  onSelect,
}: LibraryScreenProps) {
  // 입력값은 즉시 에코(로컬), 서버 반영은 350ms 디바운스(Flutter _onQueryChanged).
  const [query, setQuery] = useState(filter.query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // 디바운스가 살아있는 동안 filter prop 은 값이 바뀌지 않는다(축 변경은 아래에서 디바운스를
    // 취소+즉시 커밋하므로) → 클로저가 캡처한 filter 는 안전하다.
    debounceRef.current = setTimeout(() => {
      onFilterChange({ ...filter, query: value.trim() });
    }, 350);
  }

  // 칩(축) 변경은 디바운스를 취소하고 즉시 반영(Flutter _onTabChanged).
  // 입력 중이던 검색어도 함께 커밋해 누락 없이 최신 _query 로 로드(Flutter 와 동일).
  function onAxisChange(partial: Partial<ScenarioFilterState>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onFilterChange({ ...filter, ...partial, query: query.trim() });
  }

  const hasResults = scenarios.length > 0;

  return (
    <section className={styles.library}>
      <header className={styles.head}>
        <h1 className={styles.title}>시나리오 라이브러리</h1>
        <span className={styles.eyebrow}>MYSTERY LIBRARY</span>
      </header>

      <TextField
        value={query}
        onChange={onQueryChange}
        placeholder="사건명, 태그, 제작자 검색…"
        suffixIcon={Search}
        ariaLabel="시나리오 검색"
      />

      <div className={styles.filters}>
        <FilterAxis
          label="정렬"
          options={SORT_OPTIONS}
          value={filter.sort}
          onChange={(value) =>
            onAxisChange({ sort: value as ScenarioFilterState["sort"] })
          }
        />
        <FilterAxis
          label="유형"
          options={TYPE_OPTIONS}
          value={filter.type}
          onChange={(value) =>
            onAxisChange({ type: value as ScenarioFilterState["type"] })
          }
        />
        <FilterAxis
          label="난이도"
          options={DIFFICULTY_OPTIONS}
          value={filter.difficulty}
          onChange={(value) =>
            onAxisChange({
              difficulty: value as ScenarioFilterState["difficulty"],
            })
          }
        />
      </div>

      <div className={styles.divider} aria-hidden />

      <div className={styles.listHead}>
        <Kicker label="사건 목록" className={styles.kickerGrow} />
        <span className={styles.count}>
          {loading ? "검색 중" : `${scenarios.length}건`}
        </span>
      </div>

      {loading ? (
        <ListSkeleton itemCount={5} itemHeight={96} />
      ) : !hasResults ? (
        error ? (
          <Empty
            icon={CloudOff}
            title="불러오지 못했습니다"
            subtitle={error}
            action={
              <Button label="다시 시도" variant="secondary" onPress={onRefresh} />
            }
          />
        ) : (
          <Empty icon={SearchX} title="일치하는 사건이 없습니다" />
        )
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
          {error ? (
            // 목록이 있는데 에러 = 추가 로드 실패(웹은 조용히 복구 가능하도록 메시지 노출 →
            // 웹 동작 보존). Flutter 는 더보기 실패를 무음 처리하지만, 웹은 error 를 세팅하므로 표시.
            <li className={styles.errorRow}>
              <span className={styles.errorText}>{error}</span>
              <Button label="다시 시도" variant="secondary" onPress={onRefresh} />
            </li>
          ) : hasNext ? (
            <li className={styles.more}>
              {loadingMore ? (
                <span className={styles.moreSpinner}>
                  <Spinner size={20} />
                </span>
              ) : (
                <Button
                  label="더보기"
                  variant="secondary"
                  expanded
                  onPress={onLoadMore}
                />
              )}
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}

// ── 필터 축 행(라벨 + 칩 가로 스크롤) ───────────────────────────────────────────
// 웹 3축 모델을 위한 래퍼. Flutter 단일탭엔 없는 축 라벨을 좌측에 둬 3그룹을 구분.
function FilterAxis({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<readonly [string, string]>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.axis}>
      <span className={styles.axisLabel}>{label}</span>
      <div className={styles.chips}>
        {options.map(([optionValue, text]) => (
          <FilterChip
            key={`${label}-${optionValue}`}
            label={text}
            active={value === optionValue}
            onPress={() => onChange(optionValue)}
          />
        ))}
      </div>
    </div>
  );
}
