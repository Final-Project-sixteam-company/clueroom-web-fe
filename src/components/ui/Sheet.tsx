import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import styles from "./Sheet.module.css";

// 픽셀 정본: lib/components/game_modals.dart · review_write_sheet.dart 의 showModalBottomSheet 공통 chrome.
//   bgElev 패널(상단 r6) + 드래그 핸들(36×4 line rPill) + 하단 고정 슬라이드업/다운 + scrim(ink900 70%).
//   Flutter showModalBottomSheet(backgroundColor transparent, isScrollControlled) 를 React 제어형으로.
//   라이프사이클(mount/leaving + ESC + portal)은 Modal 과 동일 패턴.
//
// 타깃(핸드오프) = 드래그 핸들(비주얼) + 진입/퇴장 모션. 드래그-투-dismiss 제스처는 범위 밖
//   (Flutter 기본 제공이지만 명시 타깃이 아님 — 추후 폴리시). scrim/ESC 로 닫힘.
//
// 레이아웃: 패널은 flex 컬럼(max-height 88dvh). 핸들=flex none, 나머지 children 이 flex 아이템이 되므로
//   스크롤이 필요한 본문은 children 안에서 flex:1 + overflow-y:auto 로 감싼다(각 시트가 소유).

const TRANSITION_MS = 320; // dur3

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  /** 패널에 더할 클래스(시트별 내부 패딩/간격용). */
  className?: string;
}

export function Sheet({ open, onClose, ariaLabel, children, className }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);

  // open 토글 → 마운트/언마운트 + 진입/퇴장 애니메이션(Modal 과 동일)
  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  // ESC 닫기
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`${styles.scrim} ${leaving ? styles.leaving : styles.entering}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={className ? `${styles.panel} ${className}` : styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden />
        {children}
      </div>
    </div>,
    document.body,
  );
}
