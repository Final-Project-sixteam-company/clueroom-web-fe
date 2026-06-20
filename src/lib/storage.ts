import { DEVICE_KEY } from "../config/env";

export async function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be blocked in private browsing.
  }
}

export async function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage may be blocked in private browsing.
  }
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDeviceId() {
  const stored = await safeGet(DEVICE_KEY);
  if (stored) return stored;

  const generated =
    globalThis.crypto?.randomUUID?.() ??
    `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await safeSet(DEVICE_KEY, generated);
  return generated;
}
