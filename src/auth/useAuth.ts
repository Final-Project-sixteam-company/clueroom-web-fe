// Auth domain hook — owns auth/session token state, the refresh controller, the
// authenticated-request spine, and the login/logout flows. Extracted from the
// App god-component (Flutter services/auth_service.dart). The cross-cutting bits
// the hook can't own are injected: onAuthenticated (shell navigates home) and
// onLogout (shell resets game/session state and navigates to login). All the
// regression-critical logic lives in the pure, unit-tested helpers it composes:
// refreshController (single-flight + generation guard) and withAuthRetry.

import { useEffect, useRef, useState } from "react";

import {
  ENABLE_KAKAO_LOGIN,
  KAKAO_LOGIN_STATE,
  ACCESS_KEY,
  REFRESH_KEY,
} from "../config/env";
import type { Tokens, UserProfile } from "../types";
import { safeGet, safeSet, safeRemove, getDeviceId } from "../lib/storage";
import { request } from "../api/request";
import { ApiError } from "../api/ApiError";
import { normalizeUserProfile } from "../api/normalizers";
import { kakaoRedirectUri } from "./sdkLoaders";
import {
  oauthLogin,
  kakaoCodeLogin,
  devLogin,
  refreshSession,
  serverLogout,
} from "./authClient";
import {
  createRefreshController,
  type RefreshController,
} from "./refreshController";
import { withAuthRetry } from "./withAuthRetry";

export type UseAuthArgs = {
  /** Called after a successful login; the shell navigates to home. */
  onAuthenticated: () => void;
  /** Called during logout (after auth/storage is cleared); the shell resets game/session state and navigates to login. */
  onLogout: () => void;
};

/**
 * 인증 요청 스파인의 호출 시그니처 — 도메인 훅(useRecords/useScenarios/…)이
 * 주입받아 쓰는 공유 타입. authedRequest/optionalAuthRequest 둘 다 이 형태.
 */
export type AuthedRequest = <T>(
  path: string,
  options?: RequestInit & {
    query?: Record<string, string | number | boolean>;
  },
) => Promise<T>;

export function useAuth({ onAuthenticated, onLogout }: UseAuthArgs) {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [authSessionKey, setAuthSessionKey] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const authToken = tokens?.accessToken ?? null;
  const refreshControllerRef = useRef<RefreshController | null>(null);
  const authSessionSeqRef = useRef(0);
  const refreshController = (refreshControllerRef.current ??=
    createRefreshController());

  function nextAuthSessionKey() {
    authSessionSeqRef.current += 1;
    return `session-${authSessionSeqRef.current}`;
  }

  async function persistTokens(next: Tokens) {
    const browserTokens: Tokens = {
      ...next,
      refreshToken: undefined,
    };
    await safeSet(ACCESS_KEY, next.accessToken);
    await safeRemove(REFRESH_KEY);
    setTokens(browserTokens);
  }

  async function clearAuthSession() {
    await safeRemove(ACCESS_KEY);
    await safeRemove(REFRESH_KEY);
    setTokens(null);
    setAuthSessionKey(null);
    setProfile(null);
  }

  async function replaceAuthSession(next: Tokens) {
    refreshController.bumpGeneration();
    await persistTokens(next);
    setAuthSessionKey(nextAuthSessionKey());
  }

  async function logout() {
    refreshController.reset();
    const legacyRefreshToken =
      tokens?.refreshToken ?? (await safeGet(REFRESH_KEY));
    try {
      await serverLogout(legacyRefreshToken);
    } catch {
      // 서버 revoke 실패와 무관하게 로컬 로그아웃은 완료한다.
    } finally {
      await clearAuthSession();
      onLogout();
    }
  }

  async function refreshTokens() {
    return refreshController.refresh<Tokens>({
      fetchTokens: async () => {
        const legacyRefreshToken =
          tokens?.refreshToken ?? (await safeGet(REFRESH_KEY));
        return refreshSession(legacyRefreshToken);
      },
      extractToken: (next) => next.accessToken,
      persist: (next) => persistTokens(next),
      clearOnFailure: clearAuthSession,
    });
  }

  function authedRequest<T>(
    path: string,
    options: RequestInit & {
      query?: Record<string, string | number | boolean>;
    } = {},
  ) {
    return withAuthRetry<T>({
      getToken: async () => tokens?.accessToken ?? (await safeGet(ACCESS_KEY)),
      send: (token) => request<T>(path, { ...options, token }),
      refresh: refreshTokens,
      isUnauthorized: (error) =>
        error instanceof ApiError && error.status === 401,
      onMissingToken: () => {
        throw new ApiError("로그인이 필요합니다.", "AUTH_REQUIRED", 401);
      },
      onRefreshExhausted: (original) => {
        throw original;
      },
    });
  }

  function optionalAuthRequest<T>(
    path: string,
    options: RequestInit & {
      query?: Record<string, string | number | boolean>;
    } = {},
  ) {
    return withAuthRetry<T>({
      getToken: async () => tokens?.accessToken ?? (await safeGet(ACCESS_KEY)),
      send: (token) => request<T>(path, { ...options, token }),
      refresh: refreshTokens,
      isUnauthorized: (error) =>
        error instanceof ApiError && error.status === 401,
      onMissingToken: () => request<T>(path, options),
      onRefreshExhausted: async () => {
        await clearAuthSession();
        return request<T>(path, options);
      },
    });
  }

  async function loadProfile() {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await authedRequest<unknown>("/api/auth/me");
      setProfile(normalizeUserProfile(data));
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "내 정보를 불러오지 못했습니다.",
      );
      setProfile({
        nickname: "탐정 견습생",
        provider: "WEB",
      });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setAuthError(null);
    try {
      const deviceId = await getDeviceId();
      const data = await oauthLogin(idToken, deviceId);
      await replaceAuthSession(data);
      onAuthenticated();
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Google 로그인 연동에 실패했습니다.",
      );
    }
  }

  async function handleKakaoAuthorizationCode(authorizationCode: string) {
    setAuthError(null);
    try {
      const deviceId = await getDeviceId();
      const data = await kakaoCodeLogin(
        authorizationCode,
        kakaoRedirectUri(),
        deviceId,
      );
      await replaceAuthSession(data);
      onAuthenticated();
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Kakao 로그인 연동에 실패했습니다.",
      );
    }
  }

  async function handleDevLogin(
    email: string,
    nickname?: string,
    fallbackMessage = "개발 로그인에 실패했습니다.",
  ) {
    setAuthError(null);
    try {
      const deviceId = await getDeviceId();
      const data = await devLogin(email, nickname, deviceId);
      await replaceAuthSession(data);
      onAuthenticated();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : fallbackMessage);
    }
  }

  useEffect(() => {
    void (async () => {
      const callbackParams = new URLSearchParams(window.location.search);
      if (
        ENABLE_KAKAO_LOGIN &&
        callbackParams.get("state") === KAKAO_LOGIN_STATE
      ) {
        const code = callbackParams.get("code");
        const kakaoError =
          callbackParams.get("error_description") ??
          callbackParams.get("error");
        window.history.replaceState(null, "", "/");
        if (code) {
          await handleKakaoAuthorizationCode(code);
        } else if (kakaoError) {
          setAuthError(kakaoError);
        } else {
          setAuthError("Kakao 로그인 응답을 확인하지 못했습니다.");
        }
        setAuthReady(true);
        return;
      }

      const accessToken = await safeGet(ACCESS_KEY);
      const legacyRefreshToken = await safeGet(REFRESH_KEY);
      if (accessToken || legacyRefreshToken) {
        const generation = refreshController.generation;
        try {
          // Stored access tokens can be expired or revoked. Verify the session
          // with the refresh cookie before any auth-aware loaders attach Bearer.
          const next = await refreshSession(legacyRefreshToken);
          if (generation === refreshController.generation) {
            await persistTokens(next);
            setAuthSessionKey(nextAuthSessionKey());
          }
        } catch {
          if (generation === refreshController.generation) {
            await clearAuthSession();
          }
        }
      }
      setAuthReady(true);
    })();
    // Kakao callback and persisted-token bootstrap must run once on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    tokens,
    authToken,
    authSessionKey,
    authReady,
    authError,
    setAuthError,
    profile,
    profileLoading,
    profileError,
    authedRequest,
    optionalAuthRequest,
    loadProfile,
    logout,
    handleGoogleCredential,
    handleDevLogin,
  };
}
