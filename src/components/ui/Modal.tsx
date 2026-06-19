import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import styles from "./Modal.module.css";

// 픽셀 정본: lib/components/overlays.dart (showMSModal)
// scrim barrier(클릭/ESC 닫힘), fade+scale(.98→1)+8px up @dur3, card maxW360 pad24 bgElev r6, 이중 그림자.
// Flutter 의 명령형 showMSModal 을 React 제어형 컴포넌트로 옮김.

const TRANSITION_MS = 320; // dur3

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Flutter primaryAction/secondaryAction — 보통 expanded <Button>. 좌(secondary)·우(primary) 배치. */
  primaryAction: ReactNode;
  secondaryAction: ReactNode;
  children?: ReactNode;
}

export function Modal({ open, title, onClose, primaryAction, secondaryAction, children }: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);

  // open 토글 → 마운트/언마운트 + 진입/퇴장 애니메이션
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
      <div className={styles.wrap}>
        <div
          className={styles.card}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className={styles.title}>{title}</h2>
          {children != null ? <div className={styles.body}>{children}</div> : null}
          <div className={styles.actions}>
            <div className={styles.action}>{secondaryAction}</div>
            <div className={styles.action}>{primaryAction}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
