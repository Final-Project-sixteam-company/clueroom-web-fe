import { useState } from "react";
import { CircleCheck, Clock, ClipboardList, SquarePen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatRow, Kicker, FilterChip, Empty } from "../ui";
import type { StatCell } from "../ui";
import type { RecordItem } from "../../types";
import styles from "./RecordsScreen.module.css";

// 픽셀 정본: lib/screens/my_records_screen.dart
//   헤더(내 기록 titleL + DETECTIVE FILE monoLabel) → 탐정 등급 카드 → MSStatRow(해결/평균/제작)
//   → Kicker '기록 목록' → 탭 필터(전체/완료/진행 중/내 시나리오) → 세션 카드 리스트 / 빈 상태.
//
// 충실도 방침(koo #4): 픽셀=Flutter 레이아웃, 데이터/동작=웹 보존.
//   · Flutter 는 samplePlaySessions(정적) + 등급 'A' 하드코딩이지만, 웹은 실제 records 를 받아
//     등급(A/B)·통계·이어하기를 동적으로 렌더(웹 동작 보존). 탭 화면이라 옛 "내 정보로 돌아가기"
//     백버튼은 제거(하단 네비로 이동, 핸드오프 §176 권고).
//   · RecordItem 엔 scenarioCode/progressPercent 가 없어 Flutter _SessionCard 를 웹 필드로 매핑:
//     코드=scenarioId 0패딩 CL-NNN(없으면 생략), 진행바(progressPercent 부재)는 생략하고
//     IN_PROGRESS 는 카드 전체를 '이어하기' 버튼으로(웹 onResume 동작 보존).
//   · 평균은 Flutter '평균 정답률 {n}%' 대신 '평균 점수' raw — 웹 score 가 %인지 불확실해 오라벨 방지.
//   · 필터 칩은 킷 FilterChip 재사용(records 로컬 _FilterChip 12×6 → 킷 10×5, 앱 전반 칩 일관 트레이드오프).
//   · 가로 패딩은 Shell <main>(20px) 상속(타 탭 화면과 동일).

type RecordsFilter = "all" | "completed" | "inProgress" | "mine";

const FILTER_OPTIONS: ReadonlyArray<readonly [RecordsFilter, string]> = [
  ["all", "전체"],
  ["completed", "완료"],
  ["inProgress", "진행 중"],
  ["mine", "내 시나리오"],
];

// 빈 상태를 필터 문맥에 맞춰 안내(Flutter _RecordsFilterLabel).
const EMPTY_COPY: Record<
  RecordsFilter,
  { icon: LucideIcon; title: string; subtitle: string }
> = {
  all: {
    icon: ClipboardList,
    title: "아직 기록이 없습니다",
    subtitle: "사건을 해결하면 여기에 기록이 남아요",
  },
  completed: {
    icon: ClipboardList,
    title: "완료된 사건이 없습니다",
    subtitle: "사건을 끝까지 해결해 보세요",
  },
  inProgress: {
    icon: ClipboardList,
    title: "진행 중인 사건이 없습니다",
    subtitle: "새 사건을 시작하면 여기에 표시돼요",
  },
  mine: {
    icon: SquarePen,
    title: "제작한 시나리오가 없습니다",
    subtitle: "시나리오를 만들면 여기에 표시돼요",
  },
};

export interface RecordsScreenProps {
  records: RecordItem[];
  onResume: (record: RecordItem) => void;
}

export function RecordsScreen({ records, onResume }: RecordsScreenProps) {
  const [filter, setFilter] = useState<RecordsFilter>("all");

  const completed = records.filter((r) => r.status === "COMPLETED");
  const inProgress = records.filter((r) => r.status === "IN_PROGRESS");
  // 현재 웹은 제작 시나리오 목록을 제공하지 않음(Flutter 와 동일하게 빈 목록).
  const authored: RecordItem[] = [];

  const scores = completed
    .map((r) => r.score)
    .filter((s): s is number => typeof s === "number");
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  // 5건 해결 시 주임 탐정(A), 이하 견습 탐정(B) — 웹 동적 등급 보존.
  const isAssociate = completed.length >= 5;
  const toNext = Math.max(0, 5 - completed.length);

  const filtered =
    filter === "completed"
      ? completed
      : filter === "inProgress"
        ? inProgress
        : filter === "mine"
          ? authored
          : records;

  const statCells: StatCell[] = [
    { label: "해결 사건", value: `${completed.length}건`, tone: "good" },
    {
      label: "평균 점수",
      value: averageScore != null ? `${averageScore}` : "-",
      tone: "good",
    },
    { label: "제작 수", value: "0개" },
  ];

  const empty = EMPTY_COPY[filter];

  return (
    <section className={styles.records}>
      <header className={styles.head}>
        <h1 className={styles.title}>내 기록</h1>
        <span className={styles.eyebrow}>DETECTIVE FILE</span>
      </header>

      <DetectiveGradeCard
        mark={isAssociate ? "A" : "B"}
        rank={isAssociate ? "주임 탐정" : "견습 탐정"}
        rankEn={isAssociate ? "ASSOCIATE DETECTIVE" : "TRAINEE DETECTIVE"}
        note={`다음 등급까지 ${toNext}건 해결 필요`}
      />

      <StatRow cells={statCells} className={styles.stat} />

      <Kicker label="기록 목록" className={styles.kicker} />

      <div className={styles.chips}>
        {FILTER_OPTIONS.map(([value, label]) => (
          <FilterChip
            key={value}
            label={label}
            active={filter === value}
            onPress={() => setFilter(value)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty icon={empty.icon} title={empty.title} subtitle={empty.subtitle} />
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((record) => (
            <li key={record.recordId}>
              <SessionCard record={record} onResume={onResume} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── 탐정 등급 카드 (_DetectiveGradeCard) — 그라디언트 + 등급 마크 ─────────────────
function DetectiveGradeCard({
  mark,
  rank,
  rankEn,
  note,
}: {
  mark: string;
  rank: string;
  rankEn: string;
  note: string;
}) {
  return (
    <div className={styles.gradeCard}>
      <span className={styles.gradeMark}>{mark}</span>
      <div className={styles.gradeMeta}>
        <span className={styles.gradeRank}>{rank}</span>
        <span className={styles.gradeRankEn}>{rankEn}</span>
        <span className={styles.gradeNote}>{note}</span>
      </div>
    </div>
  );
}

// ── 세션 카드 (_SessionCard) — 상태 아이콘 + 코드/날짜 + 제목 + 등급/이어하기 ──────────
function SessionCard({
  record,
  onResume,
}: {
  record: RecordItem;
  onResume: (record: RecordItem) => void;
}) {
  const isCompleted = record.status === "COMPLETED";
  const code =
    record.scenarioId != null
      ? `CL-${String(record.scenarioId).padStart(3, "0")}`
      : null;
  const date = formatRecordDate(record.completedAt ?? record.updatedAt);
  const StateIcon = isCompleted ? CircleCheck : Clock;

  const body = (
    <>
      <StateIcon
        size={18}
        strokeWidth={2}
        className={isCompleted ? styles.iconDone : styles.iconProgress}
        aria-hidden
      />
      <div className={styles.cardMeta}>
        <div className={styles.metaRow}>
          {code ? <span className={styles.code}>{code}</span> : null}
          {date ? <span className={styles.date}>{date}</span> : null}
        </div>
        <div className={styles.cardTitle}>{record.scenarioTitle}</div>
      </div>
      {isCompleted ? (
        record.grade ? (
          <span className={styles.grade}>{record.grade}</span>
        ) : null
      ) : (
        <span className={styles.resume}>이어하기</span>
      )}
    </>
  );

  if (isCompleted) {
    return <div className={styles.card}>{body}</div>;
  }
  return (
    <button
      type="button"
      className={`${styles.card} ${styles.cardResume}`}
      onClick={() => onResume(record)}
    >
      {body}
    </button>
  );
}

// Flutter _SessionCard._formatDate 와 동일: 'MM.DD'(2자리 0패딩).
function formatRecordDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}
