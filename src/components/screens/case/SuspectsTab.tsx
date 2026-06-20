// 정본: lib/screens/suspects_screen.dart (SuspectsScreen)
//   검색(이름·직책) + 필터칩(전체/용의자/증인) + StatRow(용의자/증인/심문 횟수)
//   + Kicker '모든 인물' + SuspectCard 리스트.
// 웹 보존(koo #4): 심문 횟수 = dashboard.interrogationCount(정본), 증인 0명이면 StatCell 생략.
//   정렬 = 증인 후순위 → 이름, 검색 = 이름·직책.
import { useState } from "react";
import { CloudOff, UserX, Search } from "lucide-react";
import type { Suspect, Dashboard } from "../../../types";
import {
  TextField,
  FilterChip,
  Kicker,
  Empty,
  Button,
  ListSkeleton,
  StatRow,
} from "../../ui";
import type { StatCell } from "../../ui";
import { SuspectCard } from "../../domain";
import styles from "./SuspectsTab.module.css";

type Filter = "all" | "suspect" | "witness";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "suspect", label: "용의자" },
  { key: "witness", label: "증인" },
];

export interface SuspectsTabProps {
  suspects: Suspect[];
  dashboard: Dashboard | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSuspectDetail: (suspect: Suspect) => void;
}

export function SuspectsTab({
  suspects,
  dashboard,
  loading,
  error,
  onRetry,
  onSuspectDetail,
}: SuspectsTabProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const suspectCount = suspects.filter((s) => !s.isWitness).length;
  const witnessCount = suspects.filter((s) => s.isWitness).length;
  const interrogationCount = dashboard?.interrogationCount ?? 0;

  const cells: StatCell[] = [
    { label: "용의자", value: `${suspectCount}명` },
    ...(witnessCount > 0
      ? [{ label: "증인", value: `${witnessCount}명` } as StatCell]
      : []),
    { label: "심문 횟수", value: `${interrogationCount}회` },
  ];

  const keyword = query.trim();
  const results = [...suspects]
    .sort((a, b) => {
      if ((a.isWitness ?? false) !== (b.isWitness ?? false)) {
        return a.isWitness ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    })
    .filter((s) => {
      const matchesQuery =
        !keyword ||
        s.name.includes(keyword) ||
        (s.role ?? "").includes(keyword);
      const matchesFilter =
        filter === "all" ||
        (filter === "suspect" && !s.isWitness) ||
        (filter === "witness" && s.isWitness);
      return matchesQuery && matchesFilter;
    });

  let list: React.ReactNode;
  if (loading && results.length === 0) {
    list = <ListSkeleton itemHeight={84} />;
  } else if (error && results.length === 0) {
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
        <Empty icon={UserX} title="인물이 없습니다" />
      </div>
    );
  } else {
    list = results.map((s) => (
      <SuspectCard
        key={s.suspectId}
        suspect={s}
        onPress={() => onSuspectDetail(s)}
      />
    ));
  }

  return (
    <div className={styles.tab}>
      <div className={styles.header}>
        <TextField
          value={query}
          onChange={setQuery}
          placeholder="용의자 이름 · 직책 검색…"
          suffixIcon={Search}
          ariaLabel="용의자 검색"
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
        <StatRow cells={cells} className={styles.stats} />
        <Kicker label="모든 인물" className={styles.kicker} />
      </div>
      <div className={styles.list}>{list}</div>
    </div>
  );
}
