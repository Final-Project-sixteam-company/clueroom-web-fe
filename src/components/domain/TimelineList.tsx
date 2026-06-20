import styles from "./TimelineList.module.css";

// 픽셀 정본: lib/components/timeline_list.dart (TimelineList / _Row)
//   컨테이너 bg+1px line+r4, pad 14×12. 행: time 칼럼 + 내용(label/desc/conflict).
//   운영 데이터에는 "21:05~21:25"처럼 긴 시간 범위가 있어 웹은 time 칼럼을 넓혀 겹침을 방지한다.
//   웹 TimelineEvent 엔 conflict 가 없음 → 옵션 필드로 노출(있을 때만 danger 블록).
//   Phase 5 에서 TimelineEvent({time,title,description}) → {time, label:title, description} 매핑.

export interface TimelineRow {
  time: string;
  label: string;
  description?: string;
  /** 정본의 conflict 블록(웹 데이터엔 없음, 옵션). */
  conflict?: string;
}

export interface TimelineListProps {
  entries: TimelineRow[];
  className?: string;
}

export function TimelineList({ entries, className }: TimelineListProps) {
  return (
    <div className={className ? `${styles.list} ${className}` : styles.list}>
      {entries.map((e, i) => {
        const hasConflict = e.conflict != null && e.conflict.length > 0;
        return (
          <div className={styles.row} key={i}>
            <span className={`${styles.time} ${hasConflict ? styles.conflictTime : ""}`}>{e.time}</span>
            <span className={styles.content}>
              <span className={styles.label}>{e.label}</span>
              {e.description ? <span className={styles.desc}>{e.description}</span> : null}
              {hasConflict ? <span className={styles.conflictBox}>{`⚠ ${e.conflict}`}</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
