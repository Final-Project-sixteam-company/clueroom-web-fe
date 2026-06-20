import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Empty.module.css";

// 픽셀 정본: lib/components/states.dart (MSEmpty)
// icon36 textMute, gap16 titleM, gap8 bodySm subtitle, action/secondaryAction 버튼.

export interface EmptyProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** 주 액션(보통 <Button>). */
  action?: ReactNode;
  /** 주 액션 아래 보조 액션. */
  secondaryAction?: ReactNode;
  className?: string;
}

export function Empty({ icon: Icon, title, subtitle, action, secondaryAction, className }: EmptyProps) {
  const classes = [styles.empty, className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <Icon size={36} strokeWidth={2} className={styles.icon} aria-hidden />
      <p className={styles.title}>{title}</p>
      {subtitle != null ? <p className={styles.subtitle}>{subtitle}</p> : null}
      {action != null ? <div className={styles.action}>{action}</div> : null}
      {secondaryAction != null ? <div className={styles.secondaryAction}>{secondaryAction}</div> : null}
    </div>
  );
}
