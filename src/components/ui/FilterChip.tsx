import styles from "./FilterChip.module.css";

// 픽셀 정본: filter_chip_row.dart + filter_chip_widget.dart (사실상 동일 → 1개로 통합)
// pad 10×5, r-pill, AnimatedContainer@dur2, active = primarySoft + primary.
// 라벨은 monoLabel 이지만 toUpperCase 하지 않음(원본 그대로).

export interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  className?: string;
}

export function FilterChip({ label, active, onPress, className }: FilterChipProps) {
  const classes = [styles.chip, active ? styles.active : "", className].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} onClick={onPress} aria-pressed={active}>
      {label}
    </button>
  );
}
