import { createContext, useContext } from "react";

// Toast 컨텍스트/훅은 ToastProvider 와 분리한다.
// (react-refresh/only-export-components: 컴포넌트 파일은 컴포넌트만 export)

export type ToastTone = "primary" | "success" | "danger";

export interface ToastApi {
  show: (message: string, options?: { tone?: ToastTone }) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToast 는 <ToastProvider> 안에서만 사용할 수 있어요.");
  }
  return ctx;
}
