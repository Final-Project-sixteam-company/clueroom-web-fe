// 정본: lib/screens/timeline_screen.dart (TimelineScreen)
//   서브헤더 'TIMELINE' + 필터칩(전체 시간대 / ⚠ 모순 발견 / 용의자 주장) + Kicker '사건 타임라인' + TimelineList.
// 웹 보존: 웹 TimelineEvent 엔 conflict 필드가 없어 모순/진술 필터는 eventType·텍스트로 파생
//   (기존 인라인 TimelineList 의 isConflict/isClaim 판정을 그대로 이식). 도메인 TimelineList 소비.
import { useState } from "react";
import { Clock, CircleAlert } from "lucide-react";
import type { TimelineEvent } from "../../../types";
import { FilterChip, Kicker, Empty } from "../../ui";
import { TimelineList } from "../../domain";
import styles from "./TimelineTab.module.css";

type Filter = "all" | "conflict" | "claim";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체 시간대" },
  { key: "conflict", label: "⚠ 모순 발견" },
  { key: "claim", label: "용의자 주장" },
];

function isConflict(event: TimelineEvent): boolean {
  const type = (event.eventType ?? "").toUpperCase();
  const text = `${event.title} ${event.description ?? ""}`;
  return type === "CONFLICT" || text.includes("모순");
}

function isClaim(event: TimelineEvent): boolean {
  const type = (event.eventType ?? "").toUpperCase();
  return type === "CLAIM" || type === "STATEMENT";
}

export interface TimelineTabProps {
  timeline: TimelineEvent[];
}

export function TimelineTab({ timeline }: TimelineTabProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "conflict"
      ? timeline.filter(isConflict)
      : filter === "claim"
        ? timeline.filter(isClaim)
        : timeline;

  const entries = filtered.map((event) => ({
    time: event.time,
    label: event.title,
    description: event.description,
  }));

  return (
    <div className={styles.tab}>
      <p className={styles.subHeader}>TIMELINE</p>

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

      <Kicker label="사건 타임라인" className={styles.kicker} />

      {entries.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty
            icon={filter === "conflict" ? CircleAlert : Clock}
            title={
              filter === "conflict"
                ? "발견된 모순이 없습니다"
                : filter === "claim"
                  ? "용의자 주장 기록이 없습니다"
                  : "아직 기록된 타임라인이 없습니다"
            }
            subtitle={
              filter === "conflict"
                ? "진술을 교차 검토하면 모순이 드러납니다."
                : filter === "claim"
                  ? "용의자를 심문하면 주장이 여기에 정리됩니다."
                  : undefined
            }
          />
        </div>
      ) : (
        <TimelineList entries={entries} />
      )}
    </div>
  );
}
