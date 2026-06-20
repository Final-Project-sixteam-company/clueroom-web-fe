import styles from "./Pill.module.css";

// 픽셀 정본: lib/components/ms_pill.dart (MSPill)
// pad 7×3, r1(2, 각짐), 1px border, monoLabel 9.5/대문자/lh1.0.
// tones: primary/success/danger/mute.

export type PillTone = "primary" | "success" | "danger" | "mute";

export interface PillProps {
  label: string;
  tone?: PillTone;
  className?: string;
}

export function Pill({ label, tone = "primary", className }: PillProps) {
  const classes = [styles.pill, styles[tone], className].filter(Boolean).join(" ");
  return <span className={classes}>{label.toUpperCase()}</span>;
}
