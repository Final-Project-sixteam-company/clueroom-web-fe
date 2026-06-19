// 정본: lib/screens/evidence_screen.dart (EvidenceScreen)
//   검색(이름·장소) + 필터칩(전체/확보됨/잠긴 증거) + Kicker '사건 증거 보드' + EvidenceTile 리스트.
// 웹 보존(koo #4): 웹 Evidence 는 isUnlocked 불리언만(시간잠금/isNew 데이터 없음).
//   · 확보됨 = isUnlocked, 잠긴 증거 = !isUnlocked (기존 웹 필터 의미 그대로).
//   · 잠긴 증거 제목은 '잠긴 증거'로 마스킹(웹 스포일러 동작 보존).
//   · 정렬: 확보됨 우선 → 제목 가나다(기존 웹 정렬).
// ⚠ koo 확인: 잠긴 증거는 EvidenceTile isTimeLocked(opacity+자물쇠+비활성)로 — 정본 픽셀.
//   기존 웹은 잠긴 증거 탭이 가능했음(상세서 해금 힌트) → 비활성으로 바뀜(한 줄로 되돌리기 가능).
import { useState } from "react";
import { CloudOff, SearchX, Search } from "lucide-react";
import type { Evidence } from "../../../types";
import { TextField, FilterChip, Kicker, Empty, Button, ListSkeleton } from "../../ui";
import { EvidenceTile } from "../../domain";
import styles from "./EvidenceTab.module.css";

type Filter = "all" | "acquired" | "locked";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "acquired", label: "확보됨" },
  { key: "locked", label: "잠긴 증거" },
];

export interface EvidenceTabProps {
  evidences: Evidence[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEvidenceDetail: (evidence: Evidence) => void;
}

export function EvidenceTab({
  evidences,
  loading,
  error,
  onRetry,
  onEvidenceDetail,
}: EvidenceTabProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const keyword = query.trim();
  const results = [...evidences]
    .sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      return a.title.localeCompare(b.title);
    })
    .filter((e) => {
      const matchesQuery =
        !keyword ||
        e.title.includes(keyword) ||
        (e.locationName ?? "").includes(keyword) ||
        (e.categoryLabel ?? e.category ?? "").includes(keyword);
      const matchesFilter =
        filter === "all" ||
        (filter === "acquired" && e.isUnlocked) ||
        (filter === "locked" && !e.isUnlocked);
      return matchesQuery && matchesFilter;
    });

  let list: React.ReactNode;
  if (loading && evidences.length === 0) {
    list = <ListSkeleton itemHeight={76} />;
  } else if (error && evidences.length === 0) {
    list = (
      <div className={styles.stateFill}>
        <Empty
          icon={CloudOff}
          title="불러오지 못했습니다"
          subtitle={error}
          action={<Button label="다시 시도" variant="secondary" onPress={onRetry} />}
        />
      </div>
    );
  } else if (results.length === 0) {
    list = (
      <div className={styles.stateFill}>
        <Empty icon={SearchX} title="일치하는 증거가 없습니다" />
      </div>
    );
  } else {
    list = results.map((e) => {
      // 잠긴 증거는 제목 마스킹(스포일러 보존). 실제 데이터는 onPress 로 원본 전달.
      const display = e.isUnlocked ? e : { ...e, title: "잠긴 증거" };
      return (
        <EvidenceTile
          key={e.evidenceId}
          evidence={display}
          isTimeLocked={!e.isUnlocked}
          onPress={() => onEvidenceDetail(e)}
        />
      );
    });
  }

  return (
    <div className={styles.tab}>
      <div className={styles.header}>
        <TextField
          value={query}
          onChange={setQuery}
          placeholder="증거 이름 · 장소 검색…"
          suffixIcon={Search}
          ariaLabel="증거 검색"
        />
        <div className={styles.chips}>
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </div>
        <Kicker label="사건 증거 보드" className={styles.kicker} />
      </div>
      <div className={styles.list}>{list}</div>
    </div>
  );
}
