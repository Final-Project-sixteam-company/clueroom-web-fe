import type { LucideIcon } from "lucide-react";
import { Spinner } from "./Spinner";
import styles from "./Button.module.css";

// 픽셀 정본: lib/components/ms_button.dart (MSButton)
// h48, r3, press scale .98@dur1, disabled opacity .42.
// variants: primary(bg primary / fg primaryInk) · secondary(투명 + 1px line)
//           · ghost(투명 / fg textSub) · danger(bg danger / fg ink0).
// label 14/600/ls−0.05, icon 16/gap 6, spinner 18/stroke 2, icon-only=48×48.

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps {
  /** 비우면(또는 미지정) 아이콘 전용 버튼(48×48)으로 취급 — Flutter `label.isEmpty`. */
  label?: string;
  /** null/undefined 이면 disabled (Flutter `onPressed == null`). */
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  /** 부모 너비를 채움. */
  expanded?: boolean;
  /** 스피너 표시 + 입력 차단(전경 불투명 유지). */
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  /** 아이콘 전용 버튼의 접근성 이름. */
  ariaLabel?: string;
  className?: string;
}

export function Button({
  label = "",
  onPress,
  variant = "primary",
  icon: Icon,
  expanded = false,
  loading = false,
  type = "button",
  ariaLabel,
  className,
}: ButtonProps) {
  const disabled = onPress == null; // Flutter _disabled — opacity .42 트리거
  const cannotPress = disabled || loading; // Flutter _cannotPress — 탭 차단
  const iconOnly = label.length === 0;

  const classes = [
    styles.button,
    styles[variant],
    expanded ? styles.expanded : "",
    iconOnly ? styles.iconOnly : "",
    disabled ? styles.disabled : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={cannotPress}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      onClick={cannotPress ? undefined : onPress}
    >
      {loading ? (
        <Spinner size={18} color="currentColor" label="" />
      ) : (
        <>
          {Icon ? <Icon size={16} strokeWidth={2} className={styles.icon} aria-hidden /> : null}
          {iconOnly ? null : <span className={styles.label}>{label}</span>}
        </>
      )}
    </button>
  );
}
