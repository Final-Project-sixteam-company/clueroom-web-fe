export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://api.clueroom.xyz";
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  import.meta.env.VITE_GOOGLE_SERVER_CLIENT_ID ??
  "";
export const KAKAO_JAVASCRIPT_KEY =
  import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY ?? "";
export const ENABLE_GOOGLE_LOGIN = !!GOOGLE_CLIENT_ID;
export const ENABLE_KAKAO_LOGIN = !!KAKAO_JAVASCRIPT_KEY;

function hasRuntimeLoginGate(kind: "dev" | "qa") {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace(/^#/, "").toLowerCase();
  const camelParam = kind === "qa" ? "qaLogin" : "devLogin";
  const kebabHash = kind === "qa" ? "qa-login" : "dev-login";
  return (
    params.get(camelParam) === "1" ||
    params.get(kind) === "1" ||
    hash === kebabHash
  );
}

export const ENABLE_DEV_LOGIN =
  (import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === "true") &&
  hasRuntimeLoginGate("dev");
export const DEFAULT_QA_LOGIN_EMAIL = (
  import.meta.env.VITE_QA_LOGIN_EMAIL ?? ""
).trim();
export const QA_LOGIN_NICKNAME =
  (import.meta.env.VITE_QA_LOGIN_NICKNAME ?? "ClueRoom QA").trim() ||
  "ClueRoom QA";
export const ENABLE_QA_LOGIN =
  (import.meta.env.DEV || import.meta.env.VITE_ENABLE_QA_LOGIN === "true") &&
  hasRuntimeLoginGate("qa");
export const KAKAO_LOGIN_STATE = "clueroom-kakao-login";

export const ACCESS_KEY = "clueroom.accessToken";
export const REFRESH_KEY = "clueroom.refreshToken";
export const DEVICE_KEY = "clueroom.deviceId";
export const RECORDS_KEY = "clueroom.records";
// 온보딩 1회 노출 플래그 — Flutter OnboardingFlag(SharedPreferences 'onboarding_complete') 대응.
export const ONBOARDING_KEY = "clueroom.onboardingComplete";
export const CASE_REFRESH_SECONDS = 30;
// 스플래시 최소 노출 시간(ms) — Flutter splash_screen.dart 의 2200ms.
export const SPLASH_DURATION_MS = 2200;
export const SCENARIO_PAGE_SIZE = 20;
export const MIN_DEDUCTION_TEXT_LENGTH = 5;
