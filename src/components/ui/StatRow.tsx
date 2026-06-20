import styles from "./StatRow.module.css";

// 픽셀 정본: lib/components/ms_stat_row.dart (MSStatRow / StatCell)
// bg, 1px line, r3, 셀별 1px 세로 구분선.
// 라벨 monoLabel 9 / ls 9*0.14 / 대문자 / textMute, 값 monoNum 15 (tone neutral/good/warn).

export type StatTone = "neutral" | "good" | "warn";

export interface StatCell {
  label: string;
  value: string;
  tone?: StatTone;
}

export interface StatRowProps {
  cells: StatCell[];
  className?: string;
}

export function StatRow({ cells, className }: StatRowProps) {
  if (cells.length === 0) return null;

  const classes = [styles.row, className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {cells.map((cell, i) => (
        <div className={styles.cell} key={i}>
          <span className={styles.label}>{cell.label.toUpperCase()}</span>
          <span className={`${styles.value} ${styles[cell.tone ?? "neutral"]}`}>{cell.value}</span>
        </div>
      ))}
    </div>
  );
}
