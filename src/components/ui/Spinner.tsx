import type { CSSProperties } from "react";
import styles from "./Spinner.module.css";

// 픽셀 정본: lib/components/states.dart (MSSpinner)
// CircularProgressIndicator strokeWidth 2, 기본 size 14, 기본 color primary.

export interface SpinnerProps {
  /** 지름(px). Flutter 기본 14. 버튼 내부에서는 18. */
  size?: number;
  /** 미지정 시 --primary. 버튼 안에서는 "currentColor"로 버튼 전경색을 상속. */
  color?: string;
  /** 접근성 라벨. 빈 문자열이면 장식용(aria-hidden)으로 처리. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 14, color, label = "로딩 중", className }: SpinnerProps) {
  // 커스텀 프로퍼티(--spinner-color)를 포함하므로 리터럴을 한 번에 캐스트.
  const style = {
    width: size,
    height: size,
    ...(color ? { "--spinner-color": color } : {}),
  } as CSSProperties;

  // 라벨이 비면(예: 버튼 내부, 컨테이너가 상태를 전달) 장식용으로 취급.
  const decorative = label.length === 0;

  return (
    <span
      className={className ? `${styles.spinner} ${className}` : styles.spinner}
      style={style}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    />
  );
}
