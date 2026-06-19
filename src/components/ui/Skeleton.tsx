import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

// 픽셀 정본: lib/components/states.dart (MSSkeleton / MSListSkeleton)
// shimmer 1600ms easeInOut, bgElev→bgHover→bgElev, 기본 radius r2.
// ListSkeleton: item h76 r4, separator 12.

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  /** 기본 r2(4). */
  radius?: number;
  className?: string;
}

export function Skeleton({ width, height, radius, className }: SkeletonProps) {
  // 커스텀 프로퍼티(--skeleton-radius)를 포함하므로 리터럴을 한 번에 캐스트.
  const style = {
    ...(width != null ? { width } : {}),
    ...(height != null ? { height } : {}),
    ...(radius != null ? { "--skeleton-radius": `${radius}px` } : {}),
  } as CSSProperties;

  return (
    <span
      className={className ? `${styles.skeleton} ${className}` : styles.skeleton}
      style={style}
      aria-hidden
    />
  );
}

export interface ListSkeletonProps {
  itemCount?: number;
  itemHeight?: number;
  className?: string;
}

export function ListSkeleton({ itemCount = 5, itemHeight = 76, className }: ListSkeletonProps) {
  const classes = [styles.list, className].filter(Boolean).join(" ");
  return (
    <div className={classes} aria-hidden>
      {Array.from({ length: itemCount }, (_, i) => (
        <Skeleton key={i} height={itemHeight} radius={10} />
      ))}
    </div>
  );
}
