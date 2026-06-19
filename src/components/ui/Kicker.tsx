import styles from "./Kicker.module.css";

// 픽셀 정본: lib/components/ms_kicker.dart (MSKicker)
// 대문자 monoLabel(textMute) + gap8 + 남은 폭 1px divider(line).

export interface KickerProps {
  label: string;
  className?: string;
}

export function Kicker({ label, className }: KickerProps) {
  const classes = [styles.kicker, className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <span className={styles.label}>{label.toUpperCase()}</span>
      <span className={styles.divider} />
    </div>
  );
}
