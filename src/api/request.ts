import { ApiError } from "./ApiError";
import { API_BASE_URL } from "../config/env";

export function apiUrl(
  path: string,
  query?: Record<string, string | number | boolean>,
) {
  const url = new URL(path, API_BASE_URL);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export function publicImageUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return new URL(trimmed, API_BASE_URL).toString();
  return undefined;
}

export function firstPublicImageUrl(
  raw: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = publicImageUrl(raw[key]);
    if (value) return value;
  }
  return undefined;
}

export async function request<T>(
  path: string,
  options: RequestInit & {
    token?: string | null;
    query?: Record<string, string | number | boolean>;
  } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const res = await fetch(apiUrl(path, options.query), {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const error = data?.error;
    throw new ApiError(
      error?.message ??
        error?.reason ??
        data?.message ??
        `요청에 실패했습니다. (${res.status})`,
      error?.code ?? error?.errorCode ?? data?.code ?? data?.error,
      res.status,
    );
  }

  if (data && typeof data === "object" && "success" in data) {
    if (data.success === true) return data.data as T;

    const error = data.error;
    throw new ApiError(
      error?.message ?? error?.reason ?? "요청에 실패했습니다.",
      error?.code ?? error?.errorCode ?? "UNKNOWN",
      error?.status ?? res.status,
    );
  }

  return data as T;
}
