// Thin, framework-agnostic wrappers over request<T>() for the auth endpoints.
// Extracted from App.tsx's login handlers / refresh / logout so the network
// shape of each auth call lives in one place (mirrors Flutter auth_service.dart).
// Request shapes are preserved 1:1 with the previous inline calls.

import { request } from "../api/request";
import type { Tokens } from "../types";

/** POST /api/auth/oauth — Google ID-token login. */
export function oauthLogin(idToken: string, deviceId: string): Promise<Tokens> {
  return request<Tokens>("/api/auth/oauth", {
    method: "POST",
    body: JSON.stringify({ provider: "GOOGLE", idToken, deviceId }),
  });
}

/** POST /api/auth/oauth/kakao/code — Kakao authorization-code login. */
export function kakaoCodeLogin(
  authorizationCode: string,
  redirectUri: string,
  deviceId: string,
): Promise<Tokens> {
  return request<Tokens>("/api/auth/oauth/kakao/code", {
    method: "POST",
    body: JSON.stringify({ authorizationCode, redirectUri, deviceId }),
  });
}

/** POST /api/auth/dev — dev/QA login. */
export function devLogin(
  email: string,
  nickname: string | undefined,
  deviceId: string,
): Promise<Tokens> {
  return request<Tokens>("/api/auth/dev", {
    method: "POST",
    body: JSON.stringify({ email, nickname, deviceId }),
  });
}

/** POST /api/auth/refresh — exchange the http-only refresh cookie (or legacy body token) for new tokens. */
export function refreshSession(
  legacyRefreshToken?: string | null,
): Promise<Tokens> {
  return request<Tokens>("/api/auth/refresh", {
    method: "POST",
    body: legacyRefreshToken
      ? JSON.stringify({ refreshToken: legacyRefreshToken })
      : undefined,
  });
}

/** POST /api/auth/logout — server-side revoke. Local logout proceeds regardless of failure. */
export function serverLogout(
  legacyRefreshToken?: string | null,
): Promise<void> {
  return request<void>("/api/auth/logout", {
    method: "POST",
    body: legacyRefreshToken
      ? JSON.stringify({ refreshToken: legacyRefreshToken })
      : undefined,
  });
}
