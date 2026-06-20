// 온보딩 1회 노출 플래그 — 정본 splash_screen.dart 의 OnboardingFlag.
// Flutter 는 SharedPreferences bool, 웹은 localStorage 문자열로 보존(safeGet/Set).

import { ONBOARDING_KEY } from "../config/env";
import { safeGet, safeSet } from "../lib/storage";

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await safeGet(ONBOARDING_KEY)) === "true";
}

export async function markOnboardingSeen(): Promise<void> {
  await safeSet(ONBOARDING_KEY, "true");
}
