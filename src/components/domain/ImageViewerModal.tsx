import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ImageOff } from "lucide-react";
import { publicImageUrl } from "../../api/request";
import { Spinner } from "../ui";
import styles from "./ImageViewerModal.module.css";

// 픽셀 정본: lib/components/image_viewer_modal.dart (정본) + image_viewer.dart(레거시) 통합 → 1개.
//   전체화면 뷰어: scrim, 우상단 닫기, contain 이미지(r6), 하단 monoLabel textSub.
//   Flutter 명령형 show() → React 제어형 <ImageViewerModal open ...>.

const TRANSITION_MS = 200; // dur2 fade

export interface ImageViewerModalProps {
  open: boolean;
  src: string;
  label?: string;
  onClose: () => void;
}

export function ImageViewerModal({ open, src, label, onClose }: ImageViewerModalProps) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const resolved = publicImageUrl(src);

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

  useEffect(() => {
    setStatus("loading");
  }, [resolved]);

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
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.closeRow}>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <X size={24} strokeWidth={2} aria-hidden />
          </button>
        </div>

        {resolved && status !== "error" ? (
          <div className={styles.imageWrap}>
            <img
              className={styles.image}
              src={resolved}
              alt={label ?? ""}
              onLoad={() => setStatus("loaded")}
              onError={() => setStatus("error")}
            />
            {status === "loading" ? (
              <div className={styles.placeholder}>
                <Spinner size={24} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <ImageOff size={48} strokeWidth={2} aria-hidden />
          </div>
        )}

        {label ? <p className={styles.label}>{label}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
