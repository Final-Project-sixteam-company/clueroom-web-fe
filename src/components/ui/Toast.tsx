import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext, type ToastApi, type ToastTone } from "./toast-context";
import styles from "./Toast.module.css";

// 픽셀 정본: lib/components/overlays.dart (MSToast)
// bottom40, tone soft bg + base border, 8px dot, bodySm, 4s 자동 fade+slide.
// Flutter 의 Overlay.insert 를 React 컨텍스트 + viewport 로 옮김.

const VISIBLE_MS = 4000; // 4s 표시
const EXIT_MS = 200; // dur2 reverse — leaving 애니메이션 후 제거

interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
  leaving: boolean;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      window.setTimeout(() => remove(id), EXIT_MS);
    },
    [remove],
  );

  const show = useCallback<ToastApi["show"]>(
    (message, options) => {
      const id = (idRef.current += 1);
      const tone = options?.tone ?? "primary";
      setToasts((list) => [...list, { id, message, tone, leaving: false }]);
      window.setTimeout(() => dismiss(id), VISIBLE_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.tone]} ${t.leaving ? styles.leaving : ""}`}
            role="alert"
          >
            <span className={styles.dot} aria-hidden />
            <span className={styles.message}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
