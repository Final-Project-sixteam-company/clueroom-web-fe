import type { LucideIcon } from "lucide-react";
import styles from "./BottomNav.module.css";

// 픽셀 정본: lib/components/ms_bottom_nav.dart (MSBottomNav)
// 외곽 pad h16/v8(+SafeArea bottom), 내부 컨테이너 bg + 1px line + r4, pad h4/v6.
// 아이콘 22, 라벨 11/500, active primary / inactive textMute.
// 탭 구성은 앱별이므로 제너릭 — 정본 5탭은 ./case-nav-items 의 CASE_NAV_ITEMS 참조.

export interface BottomNavItem {
  label: string;
  icon: LucideIcon;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  currentIndex: number;
  onTap: (index: number) => void;
  className?: string;
}

export function BottomNav({ items, currentIndex, onTap, className }: BottomNavProps) {
  const classes = [styles.nav, className].filter(Boolean).join(" ");
  return (
    <nav className={classes}>
      <div className={styles.bar}>
        {items.map((item, i) => {
          const active = i === currentIndex;
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={i}
              className={`${styles.item} ${active ? styles.active : ""}`}
              onClick={() => onTap(i)}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={2} className={styles.icon} aria-hidden />
              <span className={styles.label}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
