// lib/storage 의 delay 와 동일한 기본 sleep — 로컬 import 0 으로 유지해
// node:test 가 이 순수 모듈을 의존성 없이 그대로 로드할 수 있게 한다.
const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 정본: App.tsx 의 pollResult 재시도 루프 (회귀 민감 — 제출 후 결과 폴링).
 * fetchOnce 가 성공하면 즉시 그 값을 반환하고, 던지면 delayMs 만큼 쉰 뒤 재시도한다.
 * attempts 회 모두 실패하면 마지막 에러를 던진다.
 *
 * 정본과 1:1: 마지막 시도가 실패해도 throw 전에 한 번 더 sleep 한다(원본 catch 안의 delay).
 * sleep 은 주입 가능(테스트에서 실제 대기 없이 검증) — 기본값은 defaultSleep.
 */
export async function pollWithRetry<T>(
  fetchOnce: () => Promise<T>,
  options: {
    attempts: number;
    delayMs: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<T> {
  const { attempts, delayMs, sleep = defaultSleep } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchOnce();
    } catch (error) {
      lastError = error;
      await sleep(delayMs);
    }
  }
  throw lastError;
}
