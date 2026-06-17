import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://api.clueroom.xyz";
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  import.meta.env.VITE_GOOGLE_SERVER_CLIENT_ID ??
  "";
const ENABLE_GOOGLE_LOGIN = !!GOOGLE_CLIENT_ID;
const ENABLE_DEV_LOGIN =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === "true";

const ACCESS_KEY = "clueroom.accessToken";
const REFRESH_KEY = "clueroom.refreshToken";
const DEVICE_KEY = "clueroom.deviceId";
const RECORDS_KEY = "clueroom.records";
const BOOKMARKS_KEY = "clueroom.bookmarkedScenarios";
const REVIEWS_KEY = "clueroom.scenarioReviews";
const CASE_REFRESH_SECONDS = 30;

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

type View =
  | "login"
  | "home"
  | "profile"
  | "records"
  | "library"
  | "scenarioDetail"
  | "briefing"
  | "case"
  | "evidenceDetail"
  | "suspectDetail"
  | "chat"
  | "submit"
  | "result";

type Tokens = {
  accessToken: string;
  refreshToken?: string;
};

type UserProfile = {
  userId?: number;
  email?: string;
  nickname: string;
  provider?: string;
  profileImageUrl?: string;
};

type RecordItem = {
  recordId: string;
  sessionId?: number;
  scenarioId?: number;
  scenarioTitle: string;
  status: "IN_PROGRESS" | "COMPLETED";
  score?: number;
  grade?: string;
  updatedAt: string;
  completedAt?: string;
};

type ImagePreview = {
  url: string;
  title: string;
  subtitle?: string;
};

type ScenarioFilterState = {
  query: string;
  sort: "popular" | "latest" | "rating";
  type: "" | "OFFICIAL" | "CUSTOM";
  difficulty: "" | "EASY" | "NORMAL" | "HARD";
};

type ScenarioReview = {
  reviewId: string;
  scenarioId: number;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
  isSpoiler: boolean;
};

type ReviewDraftTarget = {
  scenarioId: number;
  title: string;
};

type Scenario = {
  scenarioId: number;
  title: string;
  description: string;
  difficulty: string;
  scenarioType: string;
  estimatedPlayTimeMinutes: number;
  suspectCount: number;
  evidenceCount: number;
  averageRating: number;
  playCount: number;
  thumbnailUrl?: string;
  synopsis?: string;
  tags?: string[];
  author?: string;
  canPlay?: boolean;
};

type Dashboard = {
  sessionId: number;
  scenarioId: number;
  scenarioTitle: string;
  status: string;
  elapsedSeconds: number;
  unlockedEvidenceCount: number;
  totalEvidenceCount: number;
  interrogationCount: number;
  briefing?: {
    victimName?: string;
    foundLocation?: string;
    summary?: string;
  };
};

type CaseLocation = {
  locationId: number;
  name: string;
  floor?: string;
  description?: string;
  imageUrl?: string;
  mapX?: number;
  mapY?: number;
  totalEvidenceCount: number;
  unlockedEvidenceCount: number;
};

type Hint = {
  hintId: number;
  hintLevel: number;
  isAvailable: boolean;
  isUsed: boolean;
  penaltyScore: number;
  content?: string;
  remainingMinutes?: number;
};

type Evidence = {
  evidenceId: number;
  title: string;
  isUnlocked: boolean;
  description?: string;
  locationName?: string;
  unlockHint?: string;
  categoryLabel?: string;
  category?: string;
  imageUrl?: string;
  oneLine?: string;
  guidance?: Guidance;
  relatedSuspects?: { suspectId: number; name: string }[];
  relatedTimelineEvents?: TimelineEvent[];
};

type Guidance = {
  readingPoints?: string[];
  compareEvidences?: {
    evidenceId?: number;
    title?: string;
    isUnlocked?: boolean;
    unlockHint?: string;
  }[];
  suggestedQuestions?: SuggestedQuestion[];
};

type SuggestedQuestion = {
  targetSuspectId?: number;
  targetName?: string;
  question: string;
  presentedEvidenceId?: number;
  questionType?: string;
};

type InterrogationLog = {
  interrogationId: number;
  suspectId: number;
  suspectName: string;
  question: string;
  answer: string;
  questionType?: string;
  presentedEvidence?: {
    evidenceId: number;
    title: string;
  };
  createdAt?: string;
};

type Suspect = {
  suspectId: number;
  name: string;
  role?: string;
  relationToVictim?: string;
  publicStatement?: string;
  publicAlibi?: string;
  alibi?: string;
  personalityTone?: string;
  portraitImageUrl?: string;
  isWitness?: boolean;
  interrogationCount?: number;
};

type TimelineEvent = {
  time: string;
  title: string;
  description?: string;
  relatedEvidenceId?: number;
};

type ChatMessage = {
  sender: "detective" | "suspect";
  text: string;
  presentedEvidenceId?: number;
};

type Result = {
  sessionId: number;
  score: number;
  grade: string;
  feedback?: string;
  fullExplanation?: string;
  correctCulprit?: {
    suspectId?: number;
    name: string;
    role?: string;
  };
  matchedParts?: string[];
  missedParts?: string[];
  keyEvidences?: {
    evidenceId?: number;
    title: string;
  }[];
  nextRecommendedScenarios?: {
    scenarioId: number;
    title: string;
    description?: string;
    thumbnailUrl?: string;
  }[];
  matched?: {
    culprit?: boolean;
    motive?: boolean;
    method?: boolean;
    coverUp?: boolean;
    keyEvidences?: number;
  };
};

class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be blocked in private browsing.
  }
}

async function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage may be blocked in private browsing.
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDeviceId() {
  const stored = await safeGet(DEVICE_KEY);
  if (stored) return stored;

  const generated =
    globalThis.crypto?.randomUUID?.() ??
    `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await safeSet(DEVICE_KEY, generated);
  return generated;
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("google-identity-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google 로그인 스크립트를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Google 로그인 스크립트를 불러오지 못했습니다.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

function apiUrl(
  path: string,
  query?: Record<string, string | number | boolean>,
) {
  const url = new URL(path, API_BASE_URL);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function publicImageUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return new URL(trimmed, API_BASE_URL).toString();
  return undefined;
}

function firstPublicImageUrl(
  raw: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = publicImageUrl(raw[key]);
    if (value) return value;
  }
  return undefined;
}

async function request<T>(
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

function normalizeScenario(raw: Record<string, unknown>): Scenario {
  const id = Number(raw.scenarioId ?? raw.id ?? 0);
  const thumbnailUrl = firstPublicImageUrl(raw, [
    "thumbnailUrl",
    "coverImageUrl",
    "coverUrl",
    "scenarioImageUrl",
    "imageUrl",
  ]);
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tag) => String(tag)).filter(Boolean)
    : undefined;
  const creator =
    raw.creator && typeof raw.creator === "object"
      ? (raw.creator as Record<string, unknown>)
      : null;
  return {
    scenarioId: id,
    title: String(raw.title ?? "제목 없음"),
    description: String(raw.description ?? raw.synopsis ?? ""),
    difficulty: String(raw.difficulty ?? "NORMAL"),
    scenarioType: String(raw.scenarioType ?? "OFFICIAL"),
    estimatedPlayTimeMinutes: Number(raw.estimatedPlayTimeMinutes ?? 0),
    suspectCount: Number(raw.suspectCount ?? 0),
    evidenceCount: Number(raw.evidenceCount ?? 0),
    averageRating: Number(raw.averageRating ?? 0),
    playCount: Number(raw.playCount ?? 0),
    thumbnailUrl,
    synopsis:
      typeof raw.synopsis === "string"
        ? raw.synopsis
        : typeof raw.description === "string"
          ? raw.description
          : undefined,
    tags,
    author:
      typeof creator?.nickname === "string"
        ? creator.nickname
        : typeof raw.author === "string"
          ? raw.author
          : undefined,
    canPlay: typeof raw.canPlay === "boolean" ? raw.canPlay : undefined,
  };
}

function normalizeGuidance(raw: unknown): Guidance | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const data = raw as Record<string, unknown>;

  const readingPoints = Array.isArray(data.readingPoints)
    ? data.readingPoints.map((point) => String(point).trim()).filter(Boolean)
    : undefined;

  const compareEvidences = Array.isArray(data.compareEvidences)
    ? data.compareEvidences.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          evidenceId:
            typeof row.evidenceId === "number"
              ? row.evidenceId
              : row.evidenceId
                ? Number(row.evidenceId)
                : undefined,
          title: typeof row.title === "string" ? row.title : undefined,
          isUnlocked: row.isUnlocked === true,
          unlockHint:
            typeof row.unlockHint === "string" ? row.unlockHint : undefined,
        };
      })
    : undefined;

  const suggestedQuestions = Array.isArray(data.suggestedQuestions)
    ? data.suggestedQuestions
        .map((item) => {
          const row = item as Record<string, unknown>;
          return {
            targetSuspectId:
              typeof row.targetSuspectId === "number"
                ? row.targetSuspectId
                : row.targetSuspectId
                  ? Number(row.targetSuspectId)
                  : undefined,
            targetName:
              typeof row.targetName === "string" ? row.targetName : undefined,
            question: String(row.question ?? "").trim(),
            presentedEvidenceId:
              typeof row.presentedEvidenceId === "number"
                ? row.presentedEvidenceId
                : row.presentedEvidenceId
                  ? Number(row.presentedEvidenceId)
                  : undefined,
            questionType:
              typeof row.questionType === "string"
                ? row.questionType
                : undefined,
          };
        })
        .filter((item) => item.question)
    : undefined;

  if (
    !readingPoints?.length &&
    !compareEvidences?.length &&
    !suggestedQuestions?.length
  ) {
    return undefined;
  }

  return { readingPoints, compareEvidences, suggestedQuestions };
}

function normalizeEvidence(raw: Record<string, unknown>): Evidence {
  const location =
    raw.location && typeof raw.location === "object"
      ? (raw.location as Record<string, unknown>)
      : null;
  const imageUrl = firstPublicImageUrl(raw, [
    "imageUrl",
    "resolvedImageUrl",
    "evidenceImageUrl",
    "photoUrl",
    "thumbnailUrl",
  ]);
  const relatedSuspects = Array.isArray(raw.relatedSuspects)
    ? raw.relatedSuspects.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          suspectId: Number(row.suspectId ?? 0),
          name: String(row.name ?? ""),
        };
      })
    : undefined;
  const relatedTimelineEvents = Array.isArray(raw.relatedTimelineEvents)
    ? raw.relatedTimelineEvents.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          time: String(row.time ?? ""),
          title: String(row.title ?? ""),
          description:
            typeof row.description === "string" ? row.description : undefined,
          relatedEvidenceId:
            typeof row.relatedEvidenceId === "number"
              ? row.relatedEvidenceId
              : undefined,
        };
      })
    : undefined;

  return {
    evidenceId: Number(raw.evidenceId ?? raw.id ?? 0),
    title: String(raw.title ?? raw.name ?? "증거"),
    isUnlocked: raw.isUnlocked === true,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    locationName:
      typeof raw.locationName === "string"
        ? raw.locationName
        : typeof location?.name === "string"
          ? location.name
          : undefined,
    unlockHint: typeof raw.unlockHint === "string" ? raw.unlockHint : undefined,
    category:
      typeof raw.category === "string"
        ? raw.category
        : typeof raw.evidenceType === "string"
          ? raw.evidenceType
          : undefined,
    categoryLabel:
      typeof raw.categoryLabel === "string" ? raw.categoryLabel : undefined,
    imageUrl,
    oneLine: typeof raw.oneLine === "string" ? raw.oneLine : undefined,
    guidance: normalizeGuidance(raw.guidance),
    relatedSuspects,
    relatedTimelineEvents,
  };
}

function normalizeTimelineEvent(raw: Record<string, unknown>): TimelineEvent {
  return {
    time: String(raw.time ?? raw.eventTime ?? raw.occurredAt ?? ""),
    title: String(raw.title ?? raw.name ?? "타임라인"),
    description:
      typeof raw.description === "string"
        ? raw.description
        : typeof raw.detail === "string"
          ? raw.detail
          : undefined,
    relatedEvidenceId:
      typeof raw.relatedEvidenceId === "number"
        ? raw.relatedEvidenceId
        : raw.relatedEvidenceId
          ? Number(raw.relatedEvidenceId)
          : undefined,
  };
}

function normalizeLocations(raw: unknown): CaseLocation[] {
  const list =
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as Record<string, unknown>).locations)
      ? ((raw as Record<string, unknown>).locations as unknown[])
      : Array.isArray(raw)
        ? raw
        : [];

  return list.map((item) => {
    const row = item as Record<string, unknown>;
    const imageUrl = firstPublicImageUrl(row, [
      "imageUrl",
      "resolvedImageUrl",
      "locationImageUrl",
      "photoUrl",
    ]);
    return {
      locationId: Number(row.locationId ?? row.id ?? 0),
      name: String(row.name ?? "장소"),
      floor: typeof row.floor === "string" ? row.floor : undefined,
      description:
        typeof row.description === "string" ? row.description : undefined,
      imageUrl,
      mapX: typeof row.mapX === "number" ? row.mapX : undefined,
      mapY: typeof row.mapY === "number" ? row.mapY : undefined,
      totalEvidenceCount: Number(row.totalEvidenceCount ?? 0),
      unlockedEvidenceCount: Number(row.unlockedEvidenceCount ?? 0),
    };
  });
}

function normalizeLocationPayload(raw: unknown) {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    mapImageUrl: firstPublicImageUrl(data, [
      "mapImageUrl",
      "resolvedMapImageUrl",
      "imageUrl",
    ]),
    locations: normalizeLocations(raw),
  };
}

function normalizeHint(raw: Record<string, unknown>): Hint {
  return {
    hintId: Number(raw.hintId ?? raw.id ?? 0),
    hintLevel: Number(raw.hintLevel ?? 0),
    isAvailable: raw.isAvailable === true,
    isUsed: raw.isUsed === true,
    penaltyScore: Number(raw.penaltyScore ?? 0),
    content: typeof raw.content === "string" ? raw.content : undefined,
    remainingMinutes:
      typeof raw.remainingMinutes === "number"
        ? raw.remainingMinutes
        : undefined,
  };
}

function normalizeSuspect(raw: Record<string, unknown>): Suspect {
  const portrait = firstPublicImageUrl(raw, [
    "portraitImageUrl",
    "profileImageUrl",
    "imageUrl",
    "resolvedImageUrl",
  ]);

  return {
    suspectId: Number(raw.suspectId ?? raw.id ?? 0),
    name: String(raw.name ?? "이름 없음"),
    role: typeof raw.role === "string" ? raw.role : undefined,
    relationToVictim:
      typeof raw.relationToVictim === "string"
        ? raw.relationToVictim
        : undefined,
    publicStatement:
      typeof raw.publicStatement === "string" ? raw.publicStatement : undefined,
    publicAlibi:
      typeof raw.publicAlibi === "string" ? raw.publicAlibi : undefined,
    alibi: typeof raw.alibi === "string" ? raw.alibi : undefined,
    personalityTone:
      typeof raw.personalityTone === "string" ? raw.personalityTone : undefined,
    portraitImageUrl: portrait,
    isWitness:
      raw.isWitness === true || raw.characterType === "NEUTRAL_WITNESS",
    interrogationCount: Number(raw.interrogationCount ?? 0),
  };
}

function normalizeInterrogationLog(raw: Record<string, unknown>): InterrogationLog {
  const presented =
    raw.presentedEvidence && typeof raw.presentedEvidence === "object"
      ? (raw.presentedEvidence as Record<string, unknown>)
      : null;
  const evidenceId =
    typeof presented?.evidenceId === "number"
      ? presented.evidenceId
      : typeof raw.presentedEvidenceId === "number"
        ? raw.presentedEvidenceId
        : raw.presentedEvidenceId
          ? Number(raw.presentedEvidenceId)
          : undefined;
  const evidenceTitle =
    typeof presented?.title === "string"
      ? presented.title
      : typeof raw.presentedEvidenceTitle === "string"
        ? raw.presentedEvidenceTitle
        : undefined;

  return {
    interrogationId: Number(raw.interrogationId ?? raw.id ?? Date.now()),
    suspectId: Number(raw.suspectId ?? 0),
    suspectName: String(raw.suspectName ?? raw.targetName ?? ""),
    question: String(raw.question ?? raw.userQuestion ?? "").trim(),
    answer: String(raw.answer ?? raw.response ?? "").trim(),
    questionType:
      typeof raw.questionType === "string" ? raw.questionType : undefined,
    presentedEvidence:
      evidenceId && evidenceTitle
        ? {
            evidenceId,
            title: evidenceTitle,
          }
        : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}

function messagesFromLogs(logs: InterrogationLog[], fallback: string) {
  if (!logs.length) {
    return [{ sender: "suspect" as const, text: fallback }];
  }

  return logs.flatMap((log) => {
    const rows: ChatMessage[] = [];
    if (log.question) {
      rows.push({
        sender: "detective",
        text: log.question,
        presentedEvidenceId: log.presentedEvidence?.evidenceId,
      });
    }
    if (log.answer) {
      rows.push({
        sender: "suspect",
        text: log.answer,
        presentedEvidenceId: log.presentedEvidence?.evidenceId,
      });
    }
    return rows;
  });
}

function normalizeUserProfile(raw: unknown): UserProfile {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    userId:
      typeof data.userId === "number"
        ? data.userId
        : data.id
          ? Number(data.id)
          : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    nickname:
      typeof data.nickname === "string" && data.nickname.trim()
        ? data.nickname.trim()
        : typeof data.name === "string" && data.name.trim()
          ? data.name.trim()
          : "탐정 견습생",
    provider: typeof data.provider === "string" ? data.provider : undefined,
    profileImageUrl:
      typeof data.profileImageUrl === "string" && data.profileImageUrl.trim()
        ? data.profileImageUrl.trim()
        : undefined,
  };
}

function normalizeRecord(raw: unknown): RecordItem | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const scenarioTitle = String(data.scenarioTitle ?? "").trim();
  const updatedAt = String(data.updatedAt ?? "").trim();
  if (!scenarioTitle || !updatedAt) return null;

  const status =
    data.status === "COMPLETED" || data.status === "IN_PROGRESS"
      ? data.status
      : "IN_PROGRESS";
  const sessionId =
    typeof data.sessionId === "number"
      ? data.sessionId
      : data.sessionId
        ? Number(data.sessionId)
        : undefined;
  const scenarioId =
    typeof data.scenarioId === "number"
      ? data.scenarioId
      : data.scenarioId
        ? Number(data.scenarioId)
        : undefined;

  return {
    recordId: String(data.recordId ?? `record-${sessionId ?? updatedAt}`),
    sessionId,
    scenarioId,
    scenarioTitle,
    status,
    score:
      typeof data.score === "number"
        ? data.score
        : data.score
          ? Number(data.score)
          : undefined,
    grade: typeof data.grade === "string" ? data.grade : undefined,
    updatedAt,
    completedAt:
      typeof data.completedAt === "string" ? data.completedAt : undefined,
  };
}

function normalizeReview(raw: unknown): ScenarioReview | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const scenarioId = Number(data.scenarioId ?? 0);
  const body = String(data.body ?? data.content ?? "").trim();
  const createdAt = String(data.createdAt ?? "").trim();
  if (!scenarioId || !body || !createdAt) return null;

  return {
    reviewId: String(data.reviewId ?? data.id ?? `review-${createdAt}`),
    scenarioId,
    authorName:
      typeof data.authorName === "string" && data.authorName.trim()
        ? data.authorName.trim()
        : "나",
    rating: Math.max(1, Math.min(5, Number(data.rating ?? 5))),
    body,
    createdAt,
    isSpoiler: data.isSpoiler === true,
  };
}

function normalizeResult(raw: unknown): Result {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const matched =
    data.matched && typeof data.matched === "object"
      ? (data.matched as Record<string, unknown>)
      : {};
  const correctCulprit =
    data.correctCulprit && typeof data.correctCulprit === "object"
      ? (data.correctCulprit as Record<string, unknown>)
      : null;
  const keyEvidences = Array.isArray(data.keyEvidences)
    ? data.keyEvidences
        .map((item) => {
          const row = item as Record<string, unknown>;
          const title = String(row.title ?? row.name ?? "").trim();
          if (!title) return null;
          return {
            evidenceId:
              typeof row.evidenceId === "number"
                ? row.evidenceId
                : row.evidenceId
                  ? Number(row.evidenceId)
                  : undefined,
            title,
          };
        })
        .filter(
          (item): item is { evidenceId?: number; title: string } => !!item,
        )
    : undefined;
  const recommendations = Array.isArray(data.nextRecommendedScenarios)
    ? data.nextRecommendedScenarios
        .map((item) => {
          const row = item as Record<string, unknown>;
          const scenarioId = Number(row.scenarioId ?? row.id ?? 0);
          const title = String(row.title ?? "").trim();
          if (!scenarioId || !title) return null;
          return {
            scenarioId,
            title,
            description:
              typeof row.description === "string" ? row.description : undefined,
            thumbnailUrl:
              typeof row.thumbnailUrl === "string"
                ? row.thumbnailUrl
                : undefined,
          };
        })
        .filter(
          (item): item is NonNullable<Result["nextRecommendedScenarios"]>[0] =>
            !!item,
        )
    : undefined;

  return {
    sessionId: Number(data.sessionId ?? sessionIdFallback(data) ?? 0),
    score: Number(data.score ?? 0),
    grade: String(data.grade ?? "-"),
    feedback: typeof data.feedback === "string" ? data.feedback : undefined,
    fullExplanation:
      typeof data.fullExplanation === "string"
        ? data.fullExplanation
        : undefined,
    correctCulprit:
      correctCulprit && String(correctCulprit.name ?? "").trim()
        ? {
            suspectId:
              typeof correctCulprit.suspectId === "number"
                ? correctCulprit.suspectId
                : correctCulprit.suspectId
                  ? Number(correctCulprit.suspectId)
                  : undefined,
            name: String(correctCulprit.name),
            role:
              typeof correctCulprit.role === "string"
                ? correctCulprit.role
                : undefined,
          }
        : undefined,
    matchedParts: Array.isArray(data.matchedParts)
      ? data.matchedParts.map((part) => String(part)).filter(Boolean)
      : undefined,
    missedParts: Array.isArray(data.missedParts)
      ? data.missedParts.map((part) => String(part)).filter(Boolean)
      : undefined,
    keyEvidences,
    nextRecommendedScenarios: recommendations,
    matched: {
      culprit: matched.culprit === true,
      motive: matched.motive === true,
      method: matched.method === true,
      coverUp: matched.coverUp === true,
      keyEvidences: Number(matched.keyEvidences ?? 0),
    },
  };
}

function sessionIdFallback(data: Record<string, unknown>) {
  return data.playSessionId ?? data.id;
}

function formatDifficulty(value: string) {
  if (value === "EASY") return "쉬움";
  if (value === "HARD") return "어려움";
  return "보통";
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "CR";
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function App() {
  const [view, setView] = useState<View>("home");
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilterState>({
    query: "",
    sort: "popular",
    type: "",
    difficulty: "",
  });
  const [bookmarkedScenarioIds, setBookmarkedScenarioIds] = useState<number[]>(
    [],
  );
  const [scenarioReviews, setScenarioReviews] = useState<ScenarioReview[]>([]);
  const [reviewDraftTarget, setReviewDraftTarget] =
    useState<ReviewDraftTarget | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null,
  );
  const [scenarioDetailLoading, setScenarioDetailLoading] = useState(false);
  const [scenarioDetailError, setScenarioDetailError] = useState<string | null>(
    null,
  );

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [caseTab, setCaseTab] = useState<
    "scene" | "evidence" | "suspects" | "timeline"
  >("scene");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [locations, setLocations] = useState<CaseLocation[]>([]);
  const [caseMapImageUrl, setCaseMapImageUrl] = useState<string | undefined>();
  const [hints, setHints] = useState<Hint[]>([]);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(
    null,
  );
  const [evidenceDetailLoading, setEvidenceDetailLoading] = useState(false);
  const [evidenceDetailError, setEvidenceDetailError] = useState<string | null>(
    null,
  );
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [suspectLogs, setSuspectLogs] = useState<InterrogationLog[]>([]);
  const [suspectDetailLoading, setSuspectDetailLoading] = useState(false);

  const [chatSuspect, setChatSuspect] = useState<Suspect | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [pendingEvidenceId, setPendingEvidenceId] = useState<number | null>(
    null,
  );
  const [pendingQuestionType, setPendingQuestionType] = useState<
    "FREE" | "RECOMMENDED" | "EVIDENCE_PRESENTED"
  >("FREE");
  const [chatLoading, setChatLoading] = useState(false);

  const [selectedCulpritId, setSelectedCulpritId] = useState<number | null>(
    null,
  );
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<number[]>([]);
  const [motiveText, setMotiveText] = useState("");
  const [methodText, setMethodText] = useState("");
  const [coverUpText, setCoverUpText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const authToken = tokens?.accessToken ?? null;

  useEffect(() => {
    void (async () => {
      const accessToken = await safeGet(ACCESS_KEY);
      const refreshToken = await safeGet(REFRESH_KEY);
      if (accessToken) {
        setTokens({ accessToken, refreshToken: refreshToken ?? undefined });
      } else if (refreshToken) {
        try {
          const next = await request<Tokens>("/api/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          });
          await safeSet(ACCESS_KEY, next.accessToken);
          if (next.refreshToken) await safeSet(REFRESH_KEY, next.refreshToken);
          setTokens(next);
        } catch {
          await safeRemove(ACCESS_KEY);
          await safeRemove(REFRESH_KEY);
        }
      }
      setAuthReady(true);
    })();
  }, []);

  useEffect(() => {
    if (authReady) void loadScenarios();
    // Initial library load only; filter changes call applyScenarioFilter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  useEffect(() => {
    void loadRecords();
    void loadBookmarks();
    void loadScenarioReviews();
  }, []);

  const dashboardSessionId = dashboard?.sessionId;
  const dashboardStatus = dashboard?.status;
  const loadCaseRef = useRef<
    (id?: number | null, options?: { silent?: boolean }) => Promise<void>
  >(async () => {});

  useEffect(() => {
    if (view !== "case" || !dashboardSessionId || dashboardStatus === "COMPLETED") {
      return;
    }

    const timerId = window.setInterval(() => {
      let shouldRefresh = false;
      setDashboard((current) =>
        current && current.sessionId === dashboardSessionId
          ? (() => {
              const elapsedSeconds = current.elapsedSeconds + 1;
              shouldRefresh = elapsedSeconds % CASE_REFRESH_SECONDS === 0;
              return { ...current, elapsedSeconds };
            })()
          : current,
      );
      if (shouldRefresh) {
        void loadCaseRef.current(dashboardSessionId, { silent: true });
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [dashboardSessionId, dashboardStatus, view]);

  async function persistTokens(next: Tokens) {
    await safeSet(ACCESS_KEY, next.accessToken);
    if (next.refreshToken) await safeSet(REFRESH_KEY, next.refreshToken);
    setTokens(next);
  }

  async function logout() {
    const refreshToken = tokens?.refreshToken ?? (await safeGet(REFRESH_KEY));
    try {
      if (refreshToken) {
        await request<void>("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // 서버 revoke 실패와 무관하게 로컬 로그아웃은 완료한다.
    } finally {
      await safeRemove(ACCESS_KEY);
      await safeRemove(REFRESH_KEY);
      setTokens(null);
      setProfile(null);
      setSessionId(null);
      setDashboard(null);
      setEvidences([]);
      setSuspects([]);
      setTimeline([]);
      setLocations([]);
      setCaseMapImageUrl(undefined);
      setHints([]);
      setView("login");
    }
  }

  async function loadRecords() {
    const stored = await safeGet(RECORDS_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const list = Array.isArray(parsed)
        ? parsed
            .map(normalizeRecord)
            .filter((item): item is RecordItem => !!item)
        : [];
      setRecords(list);
    } catch {
      await safeRemove(RECORDS_KEY);
      setRecords([]);
    }
  }

  async function loadBookmarks() {
    const stored = await safeGet(BOOKMARKS_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const ids = Array.isArray(parsed)
        ? parsed.map((item) => Number(item)).filter((id) => Number.isFinite(id))
        : [];
      setBookmarkedScenarioIds([...new Set(ids)]);
    } catch {
      await safeRemove(BOOKMARKS_KEY);
      setBookmarkedScenarioIds([]);
    }
  }

  async function persistBookmarks(ids: number[]) {
    const uniqueIds = [...new Set(ids)];
    setBookmarkedScenarioIds(uniqueIds);
    await safeSet(BOOKMARKS_KEY, JSON.stringify(uniqueIds));
  }

  async function toggleScenarioBookmark(scenarioId: number) {
    const next = bookmarkedScenarioIds.includes(scenarioId)
      ? bookmarkedScenarioIds.filter((id) => id !== scenarioId)
      : [scenarioId, ...bookmarkedScenarioIds];
    await persistBookmarks(next);
  }

  async function loadScenarioReviews() {
    const stored = await safeGet(REVIEWS_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const list = Array.isArray(parsed)
        ? parsed
            .map(normalizeReview)
            .filter((item): item is ScenarioReview => !!item)
        : [];
      setScenarioReviews(list);
    } catch {
      await safeRemove(REVIEWS_KEY);
      setScenarioReviews([]);
    }
  }

  async function persistScenarioReviews(next: ScenarioReview[]) {
    const sorted = [...next].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setScenarioReviews(sorted);
    await safeSet(REVIEWS_KEY, JSON.stringify(sorted));
  }

  async function addScenarioReview(review: ScenarioReview) {
    const stored = await safeGet(REVIEWS_KEY);
    const storedReviews = stored
      ? (() => {
          try {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed)
              ? parsed
                  .map(normalizeReview)
                  .filter((item): item is ScenarioReview => !!item)
              : [];
          } catch {
            return [];
          }
        })()
      : [];
    const source = scenarioReviews.length ? scenarioReviews : storedReviews;
    await persistScenarioReviews([
      review,
      ...source.filter((item) => item.reviewId !== review.reviewId),
    ]);
  }

  async function persistRecords(next: RecordItem[]) {
    const sorted = [...next]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 30);
    setRecords(sorted);
    await safeSet(RECORDS_KEY, JSON.stringify(sorted));
  }

  async function upsertRecord(record: RecordItem) {
    const stored = await safeGet(RECORDS_KEY);
    const storedRecords = stored
      ? (() => {
          try {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed)
              ? parsed
                  .map(normalizeRecord)
                  .filter((item): item is RecordItem => !!item)
              : [];
          } catch {
            return [];
          }
        })()
      : [];
    const source = records.length ? records : storedRecords;
    const next = [
      record,
      ...source.filter((item) => item.recordId !== record.recordId),
    ];
    await persistRecords(next);
  }

  async function saveInProgressRecord(
    nextSessionId: number,
    scenario: Scenario,
  ) {
    await upsertRecord({
      recordId: `session-${nextSessionId}`,
      sessionId: nextSessionId,
      scenarioId: scenario.scenarioId,
      scenarioTitle: scenario.title,
      status: "IN_PROGRESS",
      updatedAt: new Date().toISOString(),
    });
  }

  async function saveCompletedRecord(finalResult: Result) {
    await upsertRecord({
      recordId: `session-${finalResult.sessionId || sessionId || Date.now()}`,
      sessionId: finalResult.sessionId || sessionId || undefined,
      scenarioId: dashboard?.scenarioId ?? selectedScenario?.scenarioId,
      scenarioTitle:
        dashboard?.scenarioTitle ?? selectedScenario?.title ?? "완료한 사건",
      status: "COMPLETED",
      score: finalResult.score,
      grade: finalResult.grade,
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
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
        error instanceof Error
          ? error.message
          : "내 정보를 불러오지 못했습니다.",
      );
      setProfile({
        nickname: "탐정 견습생",
        provider: "WEB",
      });
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshTokens() {
    const refreshToken = tokens?.refreshToken ?? (await safeGet(REFRESH_KEY));
    if (!refreshToken) return null;

    try {
      const next = await request<Tokens>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      await persistTokens(next);
      return next.accessToken;
    } catch {
      await safeRemove(ACCESS_KEY);
      await safeRemove(REFRESH_KEY);
      setTokens(null);
      return null;
    }
  }

  async function authedRequest<T>(
    path: string,
    options: RequestInit & {
      query?: Record<string, string | number | boolean>;
    } = {},
  ) {
    const token = tokens?.accessToken ?? (await safeGet(ACCESS_KEY));
    if (!token) {
      throw new ApiError("로그인이 필요합니다.", "AUTH_REQUIRED", 401);
    }

    try {
      return await request<T>(path, { ...options, token });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      const refreshed = await refreshTokens();
      if (!refreshed) throw error;
      return request<T>(path, { ...options, token: refreshed });
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setAuthError(null);
    try {
      const deviceId = await getDeviceId();
      const data = await request<Tokens>("/api/auth/oauth", {
        method: "POST",
        body: JSON.stringify({ provider: "GOOGLE", idToken, deviceId }),
      });
      await persistTokens(data);
      setView("home");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Google 로그인 연동에 실패했습니다.",
      );
    }
  }

  async function handleDevLogin(email: string) {
    setAuthError(null);
    try {
      const deviceId = await getDeviceId();
      const data = await request<Tokens>("/api/auth/dev", {
        method: "POST",
        body: JSON.stringify({ email, deviceId }),
      });
      await persistTokens(data);
      setView("home");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "개발 로그인에 실패했습니다.",
      );
    }
  }

  async function loadScenarios(filter = scenarioFilter) {
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      const query: Record<string, string | number> = {
        sort: filter.sort,
        page: 0,
        size: 20,
      };
      if (filter.query.trim()) query.keyword = filter.query.trim();
      if (filter.type) query.type = filter.type;
      if (filter.difficulty) query.difficulty = filter.difficulty;
      const data = await request<
        { content?: Record<string, unknown>[] } | Record<string, unknown>[]
      >("/api/scenarios", { query });
      const list = Array.isArray(data) ? data : (data.content ?? []);
      setScenarios(list.map(normalizeScenario));
    } catch (error) {
      setScenarioError(
        error instanceof Error
          ? error.message
          : "시나리오를 불러오지 못했습니다.",
      );
    } finally {
      setScenarioLoading(false);
    }
  }

  function applyScenarioFilter(next: ScenarioFilterState) {
    setScenarioFilter(next);
    void loadScenarios(next);
  }

  async function openScenarioDetail(scenario: Scenario) {
    setSelectedScenario(scenario);
    setScenarioDetailError(null);
    setView("scenarioDetail");
    setScenarioDetailLoading(true);
    try {
      const detail = await request<Record<string, unknown>>(
        `/api/scenarios/${scenario.scenarioId}`,
      );
      const normalizedDetail = normalizeScenario(detail);
      setSelectedScenario({
        ...scenario,
        ...normalizedDetail,
        thumbnailUrl: normalizedDetail.thumbnailUrl ?? scenario.thumbnailUrl,
      });
    } catch (error) {
      setScenarioDetailError(
        error instanceof Error
          ? error.message
          : "시나리오 상세를 불러오지 못했습니다.",
      );
    } finally {
      setScenarioDetailLoading(false);
    }
  }

  async function findActiveSession(scenarioId: number) {
    if (!authToken) return null;
    const active = await authedRequest<{
      hasActiveSession?: boolean;
      activeSessionId?: number;
    }>("/api/play-sessions/active", {
      query: { scenarioId },
    });
    return active.hasActiveSession ? Number(active.activeSessionId) : null;
  }

  async function startSession(scenario: Scenario) {
    if (!authToken) {
      setView("login");
      return;
    }

    setCaseLoading(true);
    setCaseError(null);
    try {
      let nextSessionId = await findActiveSession(scenario.scenarioId);

      if (!nextSessionId) {
        try {
          const created = await authedRequest<{ sessionId: number }>(
            "/api/play-sessions",
            {
              method: "POST",
              body: JSON.stringify({ scenarioId: scenario.scenarioId }),
            },
          );
          nextSessionId = created.sessionId;
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            nextSessionId = await findActiveSession(scenario.scenarioId);
          }
          if (!nextSessionId) throw error;
        }
      }

      setSessionId(nextSessionId);
      setCaseTab("scene");
      setView("case");
      await saveInProgressRecord(nextSessionId, scenario);
      await loadCase(nextSessionId);
    } catch (error) {
      setCaseError(
        error instanceof Error ? error.message : "세션을 시작하지 못했습니다.",
      );
    } finally {
      setCaseLoading(false);
    }
  }

  async function loadCase(
    id = sessionId,
    options: { silent?: boolean } = {},
  ) {
    if (!id || !authToken) return;
    if (!options.silent) {
      setCaseLoading(true);
      setCaseError(null);
    }
    try {
      const [nextDashboard, evidenceData, suspectData] = await Promise.all([
        authedRequest<Dashboard>(`/api/play-sessions/${id}/dashboard`),
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/evidences`,
          {
            query: { includeLocked: true },
          },
        ),
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/suspects`,
        ),
      ]);

      setDashboard(nextDashboard);
      setEvidences(evidenceData.map(normalizeEvidence));
      setSuspects(suspectData.map(normalizeSuspect));

      const [timelineData, locationData, hintData] = await Promise.all([
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/timeline`,
        ).catch(() => null),
        authedRequest<unknown>(`/api/play-sessions/${id}/locations`).catch(
          () => null,
        ),
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/hints`,
        ).catch(() => null),
      ]);

      if (timelineData) {
        setTimeline(timelineData.map(normalizeTimelineEvent));
      } else if (!options.silent) {
        setTimeline([]);
      }

      if (locationData) {
        const locationPayload = normalizeLocationPayload(locationData);
        setCaseMapImageUrl(locationPayload.mapImageUrl);
        setLocations(locationPayload.locations);
      } else if (!options.silent) {
        setCaseMapImageUrl(undefined);
        setLocations([]);
      }

      if (hintData) {
        setHints(hintData.map(normalizeHint));
      } else if (!options.silent) {
        setHints([]);
      }
    } catch (error) {
      if (!options.silent) {
        setCaseError(
          error instanceof Error
            ? error.message
            : "수사 정보를 불러오지 못했습니다.",
        );
      }
    } finally {
      if (!options.silent) {
        setCaseLoading(false);
      }
    }
  }

  loadCaseRef.current = loadCase;

  async function abandonSession() {
    if (!sessionId) {
      setView("library");
      return;
    }
    const confirmed = window.confirm("진행 중인 수사를 중단할까요?");
    if (!confirmed) return;

    try {
      await authedRequest<void>(`/api/play-sessions/${sessionId}/abandon`, {
        method: "POST",
      });
      setSessionId(null);
      setDashboard(null);
      setEvidences([]);
      setSuspects([]);
      setTimeline([]);
      setLocations([]);
      setCaseMapImageUrl(undefined);
      setHints([]);
      setView("library");
    } catch (error) {
      if (error instanceof ApiError && error.code === "P003") {
        setCaseError("최종 추리 처리 중입니다. 잠시 후 결과를 다시 확인해 주세요.");
        await loadCase(sessionId, { silent: true });
        return;
      }
      setCaseError(
        error instanceof Error ? error.message : "수사를 중단하지 못했습니다.",
      );
    }
  }

  async function openEvidenceDetail(evidence: Evidence) {
    setSelectedEvidence(evidence);
    setEvidenceDetailError(null);
    setView("evidenceDetail");
    if (!sessionId || !authToken || !evidence.isUnlocked) return;

    setEvidenceDetailLoading(true);
    try {
      const detail = await authedRequest<Record<string, unknown>>(
        `/api/play-sessions/${sessionId}/evidences/${evidence.evidenceId}`,
      );
      setSelectedEvidence({
        ...evidence,
        ...normalizeEvidence(detail),
        isUnlocked: true,
      });
    } catch (error) {
      setEvidenceDetailError(
        error instanceof Error
          ? error.message
          : "증거 상세를 불러오지 못했습니다.",
      );
    } finally {
      setEvidenceDetailLoading(false);
    }
  }

  async function useHint(hint: Hint) {
    if (!sessionId || !authToken || !hint.isAvailable || hint.isUsed) return;
    try {
      const used = await authedRequest<Record<string, unknown>>(
        `/api/play-sessions/${sessionId}/hints/${hint.hintId}/use`,
        { method: "POST" },
      );
      setHints((prev) =>
        prev.map((item) =>
          item.hintId === hint.hintId
            ? {
                ...item,
                isUsed: true,
                content:
                  typeof used.content === "string"
                    ? used.content
                    : item.content,
              }
            : item,
        ),
      );
      await loadCase();
    } catch (error) {
      setCaseError(
        error instanceof Error ? error.message : "힌트를 사용할 수 없습니다.",
      );
    }
  }

  async function openSuspectDetail(suspect: Suspect) {
    setSelectedSuspect(suspect);
    setSuspectLogs([]);
    setView("suspectDetail");
    if (!sessionId || !authToken) return;

    setSuspectDetailLoading(true);
    try {
      const logs = await authedRequest<Record<string, unknown>[]>(
        `/api/play-sessions/${sessionId}/interrogations`,
        {
          query: { suspectId: suspect.suspectId },
        },
      );
      setSuspectLogs(logs.map(normalizeInterrogationLog));
    } catch {
      setSuspectLogs([]);
    } finally {
      setSuspectDetailLoading(false);
    }
  }

  async function openChat(suspect: Suspect, prefill?: SuggestedQuestion) {
    setChatSuspect(suspect);
    const fallbackMessage = suspect.publicStatement?.trim() || "무엇이 궁금하신가요?";
    setMessages([{ sender: "suspect", text: fallbackMessage }]);
    setQuestion(prefill?.question ?? "");
    setPendingEvidenceId(prefill?.presentedEvidenceId ?? null);
    setPendingQuestionType(
      prefill?.presentedEvidenceId
        ? "EVIDENCE_PRESENTED"
        : prefill?.questionType === "RECOMMENDED"
          ? "RECOMMENDED"
          : prefill
            ? "RECOMMENDED"
            : "FREE",
    );
    setView("chat");
    if (!sessionId || !authToken) return;

    try {
      const logs = await authedRequest<Record<string, unknown>[]>(
        `/api/play-sessions/${sessionId}/interrogations`,
        {
          query: { suspectId: suspect.suspectId },
        },
      );
      setMessages(
        messagesFromLogs(logs.map(normalizeInterrogationLog), fallbackMessage),
      );
    } catch {
      // 기존 대화를 못 불러와도 새 심문은 계속 가능해야 한다.
    }
  }

  async function sendQuestion() {
    const trimmed = question.trim();
    if (!sessionId || !authToken || !chatSuspect || !trimmed || chatLoading) {
      return;
    }

    const outgoingType = pendingEvidenceId
      ? "EVIDENCE_PRESENTED"
      : pendingQuestionType;
    setChatLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        sender: "detective",
        text: trimmed,
        presentedEvidenceId: pendingEvidenceId ?? undefined,
      },
    ]);
    setQuestion("");

    try {
      const answer = await authedRequest<{
        answer?: string;
        unlockedEvidences?: { evidenceId: number; title: string }[];
      }>(`/api/play-sessions/${sessionId}/interrogations`, {
        method: "POST",
        body: JSON.stringify({
          suspectId: chatSuspect.suspectId,
          questionType: outgoingType,
          question: trimmed,
          ...(pendingEvidenceId
            ? { presentedEvidenceId: pendingEvidenceId }
            : {}),
        }),
      });
      setMessages((prev) => [
        ...prev,
        {
          sender: "suspect",
          text: answer.answer ?? "답변을 받지 못했습니다.",
        },
      ]);
      setPendingEvidenceId(null);
      setPendingQuestionType("FREE");
      await loadCase();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "suspect",
          text:
            error instanceof Error
              ? error.message
              : "심문 요청에 실패했습니다.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function pollResult(id: number) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const data = await authedRequest<unknown>(
          `/api/play-sessions/${id}/result`,
        );
        return normalizeResult(data);
      } catch (error) {
        lastError = error;
        await delay(1500);
      }
    }
    throw lastError;
  }

  async function submitDeduction() {
    if (!sessionId || !authToken || !selectedCulpritId || submitting) return;
    if (!motiveText.trim() || !methodText.trim() || !coverUpText.trim()) return;
    if (selectedEvidenceIds.length < 1 || selectedEvidenceIds.length > 15) {
      return;
    }

    setSubmitting(true);
    try {
      const submitted = normalizeResult(
        await authedRequest<unknown>(
          `/api/play-sessions/${sessionId}/final-deduction`,
          {
            method: "POST",
            body: JSON.stringify({
              selectedCulpritId,
              motiveText,
              methodText,
              coverUpText,
              selectedEvidenceIds,
            }),
          },
        ),
      );
      let displayResult = submitted;
      setResult(displayResult);
      try {
        displayResult = await pollResult(sessionId);
        setResult(displayResult);
      } catch {
        // 제출 응답만으로도 결과 화면을 구성할 수 있다.
      }
      await saveCompletedRecord(displayResult);
      setView("result");
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.code === "AI010" || error.status === 409)
      ) {
        const finalResult = await pollResult(sessionId);
        setResult(finalResult);
        await saveCompletedRecord(finalResult);
        setView("result");
      } else {
        setCaseError(
          error instanceof Error
            ? error.message
            : "최종 추리 제출에 실패했습니다.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const unlockedEvidences = useMemo(
    () => evidences.filter((e) => e.isUnlocked),
    [evidences],
  );
  const accusableSuspects = useMemo(
    () => suspects.filter((s) => !s.isWitness),
    [suspects],
  );
  const resumableRecord = useMemo(
    () => records.find((record) => record.status === "IN_PROGRESS"),
    [records],
  );
  const currentReviewTarget =
    dashboard != null
      ? { scenarioId: dashboard.scenarioId, title: dashboard.scenarioTitle }
      : selectedScenario
        ? {
            scenarioId: selectedScenario.scenarioId,
            title: selectedScenario.title,
          }
        : null;

  function openProfile() {
    if (!tokens) {
      setView("login");
      return;
    }
    void loadProfile();
    setView("profile");
  }

  function scenarioFromRecord(record: RecordItem): Scenario | null {
    if (!record.scenarioId) return null;
    return (
      scenarios.find(
        (scenario) => scenario.scenarioId === record.scenarioId,
      ) ?? {
        scenarioId: record.scenarioId,
        title: record.scenarioTitle,
        description: "",
        difficulty: "NORMAL",
        scenarioType: "OFFICIAL",
        estimatedPlayTimeMinutes: 0,
        suspectCount: 0,
        evidenceCount: 0,
        averageRating: 0,
        playCount: 0,
        canPlay: true,
      }
    );
  }

  async function resumeRecord(record: RecordItem) {
    const scenario = scenarioFromRecord(record);
    if (!scenario) {
      setView("library");
      return;
    }
    setSelectedScenario(scenario);
    await startSession(scenario);
  }

  if (!authReady) {
    return (
      <Shell title="ClueRoom">
        <StateBlock title="앱을 준비하고 있습니다" />
      </Shell>
    );
  }

  return (
    <Shell
      title="ClueRoom"
      onHome={() => setView("home")}
      onLibrary={() => setView("library")}
      onProfile={tokens ? openProfile : undefined}
      onLogout={tokens ? logout : undefined}
    >
      {view === "login" && (
        <LoginScreen
          error={authError}
          onGoogleCredential={handleGoogleCredential}
          onAuthError={setAuthError}
          onDevLogin={handleDevLogin}
        />
      )}

      {view === "home" && (
        <HomeScreen
          isLoggedIn={!!tokens}
          scenarioCount={scenarios.length}
          onLogin={() => setView("login")}
          onBrowse={() => setView("library")}
          onProfile={openProfile}
          onRecords={() => setView(tokens ? "records" : "login")}
          onResume={() => {
            if (sessionId) setView("case");
            else if (resumableRecord) void resumeRecord(resumableRecord);
          }}
          hasSession={!!sessionId || !!resumableRecord}
        />
      )}

      {view === "profile" && (
        <ProfileScreen
          profile={profile}
          loading={profileLoading}
          error={profileError}
          records={records}
          onRefresh={loadProfile}
          onRecords={() => setView("records")}
          onLibrary={() => setView("library")}
          onLogout={logout}
        />
      )}

      {view === "records" && (
        <RecordsScreen
          records={records}
          onBack={() => setView("profile")}
          onLibrary={() => setView("library")}
          onResume={(record) => void resumeRecord(record)}
        />
      )}

      {view === "library" && (
        <LibraryScreen
          scenarios={scenarios}
          filter={scenarioFilter}
          loading={scenarioLoading}
          error={scenarioError}
          onRefresh={() => loadScenarios()}
          onFilterChange={applyScenarioFilter}
          onSelect={openScenarioDetail}
        />
      )}

      {view === "scenarioDetail" && selectedScenario && (
        <ScenarioDetailScreen
          scenario={selectedScenario}
          bookmarked={bookmarkedScenarioIds.includes(
            selectedScenario.scenarioId,
          )}
          reviews={scenarioReviews.filter(
            (review) => review.scenarioId === selectedScenario.scenarioId,
          )}
          loading={scenarioDetailLoading}
          error={scenarioDetailError}
          onBack={() => setView("library")}
          onStart={() => setView("briefing")}
          onToggleBookmark={() =>
            void toggleScenarioBookmark(selectedScenario.scenarioId)
          }
          onWriteReview={() =>
            setReviewDraftTarget({
              scenarioId: selectedScenario.scenarioId,
              title: selectedScenario.title,
            })
          }
          onOpenImage={(preview) => setImagePreview(preview)}
        />
      )}

      {view === "briefing" && selectedScenario && (
        <CaseBriefingScreen
          scenario={selectedScenario}
          onBack={() => setView("scenarioDetail")}
          onStart={() => startSession(selectedScenario)}
        />
      )}

      {view === "case" && (
        <CaseScreen
          caseTab={caseTab}
          setCaseTab={setCaseTab}
          dashboard={dashboard}
          evidences={evidences}
          suspects={suspects}
          timeline={timeline}
          locations={locations}
          mapImageUrl={caseMapImageUrl}
          hints={hints}
          loading={caseLoading}
          error={caseError}
          onRetry={() => loadCase()}
          onEvidenceDetail={openEvidenceDetail}
          onSuspectDetail={openSuspectDetail}
          onOpenImage={(preview) => setImagePreview(preview)}
          onUseHint={useHint}
          onAbandon={abandonSession}
          onSubmit={() => setView("submit")}
        />
      )}

      {view === "evidenceDetail" && selectedEvidence && (
        <EvidenceDetailScreen
          evidence={selectedEvidence}
          suspects={suspects}
          evidences={evidences}
          loading={evidenceDetailLoading}
          error={evidenceDetailError}
          onBack={() => setView("case")}
          onOpenImage={(preview) => setImagePreview(preview)}
          onCompareEvidence={(evidenceId) => {
            const target = evidences.find((e) => e.evidenceId === evidenceId);
            if (target) void openEvidenceDetail(target);
          }}
          onChat={openChat}
        />
      )}

      {view === "suspectDetail" && selectedSuspect && (
        <SuspectDetailScreen
          suspect={selectedSuspect}
          evidences={evidences}
          logs={suspectLogs}
          loading={suspectDetailLoading}
          onBack={() => setView("case")}
          onChat={() => openChat(selectedSuspect)}
          onSelectCulprit={() => {
            setSelectedCulpritId(selectedSuspect.suspectId);
            setView("submit");
          }}
          onEvidenceDetail={openEvidenceDetail}
        />
      )}

      {view === "chat" && chatSuspect && (
        <ChatScreen
          suspect={chatSuspect}
          messages={messages}
          question={question}
          setQuestion={(value) => {
            setQuestion(value);
            if (pendingQuestionType === "RECOMMENDED") {
              setPendingQuestionType("FREE");
            }
          }}
          pendingEvidence={evidences.find(
            (e) => e.evidenceId === pendingEvidenceId,
          )}
          evidences={unlockedEvidences}
          loading={chatLoading}
          onBack={() => setView("case")}
          onPrefill={(q) => {
            setQuestion(q);
            setPendingQuestionType("RECOMMENDED");
          }}
          onAttachEvidence={(evidenceId) => {
            setPendingEvidenceId(evidenceId);
            setPendingQuestionType("EVIDENCE_PRESENTED");
          }}
          onClearEvidence={() => {
            setPendingEvidenceId(null);
            setPendingQuestionType("FREE");
          }}
          onSend={sendQuestion}
        />
      )}

      {view === "submit" && (
        <SubmitScreen
          suspects={accusableSuspects}
          evidences={unlockedEvidences}
          selectedCulpritId={selectedCulpritId}
          setSelectedCulpritId={setSelectedCulpritId}
          selectedEvidenceIds={selectedEvidenceIds}
          setSelectedEvidenceIds={setSelectedEvidenceIds}
          motiveText={motiveText}
          setMotiveText={setMotiveText}
          methodText={methodText}
          setMethodText={setMethodText}
          coverUpText={coverUpText}
          setCoverUpText={setCoverUpText}
          submitting={submitting}
          error={caseError}
          onBack={() => setView("case")}
          onSubmit={submitDeduction}
        />
      )}

      {view === "result" && (
        <ResultScreen
          result={result}
          onHome={() => setView("home")}
          onLibrary={() => setView("library")}
          onWriteReview={
            currentReviewTarget
              ? () => setReviewDraftTarget(currentReviewTarget)
              : undefined
          }
        />
      )}
      {imagePreview && (
        <ImageViewer
          preview={imagePreview}
          onClose={() => setImagePreview(null)}
        />
      )}
      {reviewDraftTarget && (
        <ReviewDialog
          target={reviewDraftTarget}
          authorName={profile?.nickname ?? "나"}
          onCancel={() => setReviewDraftTarget(null)}
          onSubmit={(review) => {
            void addScenarioReview(review);
            setReviewDraftTarget(null);
          }}
        />
      )}
    </Shell>
  );
}

function Shell({
  children,
  title,
  onHome,
  onLibrary,
  onProfile,
  onLogout,
}: {
  children: React.ReactNode;
  title: string;
  onHome?: () => void;
  onLibrary?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="app-frame">
      <header className="topbar">
        <button className="brand" onClick={onHome} type="button">
          <span className="brand-mark">CR</span>
          <span>{title}</span>
        </button>
        <div className="topbar-actions">
          {onLibrary && (
            <button
              className="icon-button"
              onClick={onLibrary}
              type="button"
              title="사건"
            >
              사건
            </button>
          )}
          {onProfile && (
            <button
              className="icon-button"
              onClick={onProfile}
              type="button"
              title="내 정보"
            >
              내 정보
            </button>
          )}
          {onLogout && (
            <button
              className="icon-button"
              onClick={onLogout}
              type="button"
              title="로그아웃"
            >
              로그아웃
            </button>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function LoginScreen({
  error,
  onGoogleCredential,
  onAuthError,
  onDevLogin,
}: {
  error: string | null;
  onGoogleCredential: (idToken: string) => void;
  onAuthError: (message: string) => void;
  onDevLogin: (email: string) => void;
}) {
  const [email, setEmail] = useState("tester@clueroom.local");

  return (
    <section className="login-screen">
      <div className="logo-orb">
        <img src={`${import.meta.env.BASE_URL}app_icon.png`} alt="ClueRoom" />
      </div>
      <p className="eyebrow">MYSTERY LIBRARY</p>
      <h1>사건을 수사할 시간</h1>
      <p className="muted">
        웹에서 단서를 모으고, 인물을 심문하고, 마지막 추리를 제출하세요.
      </p>
      <GoogleSignInButton
        onCredential={onGoogleCredential}
        onError={onAuthError}
      />
      {!ENABLE_GOOGLE_LOGIN && !ENABLE_DEV_LOGIN && (
        <article className="auth-notice">
          Google 웹 로그인을 사용하려면 `VITE_GOOGLE_CLIENT_ID`가 필요합니다.
        </article>
      )}
      {ENABLE_DEV_LOGIN && (
        <div className="dev-login">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="테스트 이메일"
          />
          <button
            className="button secondary"
            onClick={() => onDevLogin(email)}
            type="button"
          >
            개발 로그인
          </button>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}

function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ENABLE_GOOGLE_LOGIN || !buttonRef.current) return;

    let cancelled = false;
    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              onCredential(response.credential);
              return;
            }
            onError("Google 인증 토큰을 받지 못했습니다.");
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(360, buttonRef.current.clientWidth || 360),
        });
      })
      .catch((error) => {
        if (cancelled) return;
        onError(
          error instanceof Error
            ? error.message
            : "Google 로그인 준비에 실패했습니다.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  if (!ENABLE_GOOGLE_LOGIN) return null;

  return (
    <div className="google-login-box">
      <div ref={buttonRef} />
    </div>
  );
}

function HomeScreen({
  isLoggedIn,
  scenarioCount,
  hasSession,
  onLogin,
  onBrowse,
  onProfile,
  onRecords,
  onResume,
}: {
  isLoggedIn: boolean;
  scenarioCount: number;
  hasSession: boolean;
  onLogin: () => void;
  onBrowse: () => void;
  onProfile: () => void;
  onRecords: () => void;
  onResume: () => void;
}) {
  return (
    <section className="stack">
      <div className="hero-panel">
        <p className="eyebrow">MYSTERY LIBRARY</p>
        <h1>사건을 수사할 시간</h1>
        <p>라이브러리에서 사건을 골라 단서와 진술을 대조하세요.</p>
        <div className="hero-actions">
          <button className="button primary" onClick={onBrowse} type="button">
            사건 보러 가기
          </button>
          {!isLoggedIn && (
            <button className="button ghost" onClick={onLogin} type="button">
              로그인
            </button>
          )}
        </div>
      </div>
      <div className="stats-grid">
        <Stat label="사건" value={`${scenarioCount}건`} />
        <Stat label="진행" value={hasSession ? "수사 중" : "대기"} />
        <Stat label="방식" value="AI 심문" />
      </div>
      <div className="quick-actions">
        <button className="button secondary" onClick={onProfile} type="button">
          내 정보
        </button>
        <button className="button ghost" onClick={onRecords} type="button">
          수사 기록
        </button>
      </div>
      {hasSession && (
        <button className="button secondary" onClick={onResume} type="button">
          진행 중인 수사로 돌아가기
        </button>
      )}
    </section>
  );
}

function ProfileScreen({
  profile,
  loading,
  error,
  records,
  onRefresh,
  onRecords,
  onLibrary,
  onLogout,
}: {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  records: RecordItem[];
  onRefresh: () => void;
  onRecords: () => void;
  onLibrary: () => void;
  onLogout: () => void;
}) {
  const completed = records.filter((record) => record.status === "COMPLETED");
  const bestScore = completed.reduce(
    (max, record) => Math.max(max, record.score ?? 0),
    0,
  );
  const displayName = profile?.nickname ?? "탐정 견습생";

  return (
    <section className="stack">
      <ScreenTitle title="내 정보" subtitle="MY PAGE" />
      <article className="profile-card">
        <div className="profile-avatar">
          {profile?.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={`${displayName} 프로필`} />
          ) : (
            <span>{initials(displayName)}</span>
          )}
        </div>
        <div>
          <h2>{displayName}</h2>
          <p className="muted">{profile?.email ?? "웹 로그인 사용자"}</p>
          <div className="meta-row">
            <span>{profile?.provider ?? "WEB"}</span>
            <span>{loading ? "동기화 중" : "인증됨"}</span>
          </div>
        </div>
      </article>
      {error && (
        <article className="info-card">
          <p className="mini-title">동기화 안내</p>
          <p className="card-body">{error}</p>
          <button className="chip" onClick={onRefresh} type="button">
            다시 확인
          </button>
        </article>
      )}
      <div className="stats-grid">
        <Stat label="완료" value={`${completed.length}건`} />
        <Stat label="최고 점수" value={bestScore ? `${bestScore}` : "-"} />
        <Stat
          label="진행"
          value={
            records.some((record) => record.status === "IN_PROGRESS")
              ? "있음"
              : "없음"
          }
        />
      </div>
      <div className="menu-list">
        <button className="menu-item" onClick={onRecords} type="button">
          <span>수사 기록</span>
          <small>완료한 사건과 진행 중인 사건을 확인합니다</small>
        </button>
        <button className="menu-item" onClick={onLibrary} type="button">
          <span>사건 라이브러리</span>
          <small>새로운 사건을 선택합니다</small>
        </button>
        <button className="menu-item danger" onClick={onLogout} type="button">
          <span>로그아웃</span>
          <small>이 기기의 로그인 세션을 종료합니다</small>
        </button>
      </div>
    </section>
  );
}

function RecordsScreen({
  records,
  onBack,
  onLibrary,
  onResume,
}: {
  records: RecordItem[];
  onBack: () => void;
  onLibrary: () => void;
  onResume: (record: RecordItem) => void;
}) {
  const [filter, setFilter] = useState<"all" | "completed" | "inProgress">(
    "all",
  );
  const completed = records.filter((record) => record.status === "COMPLETED");
  const inProgress = records.filter(
    (record) => record.status === "IN_PROGRESS",
  );
  const averageScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, record) => sum + (record.score ?? 0), 0) /
            completed.length,
        )
      : null;
  const filtered =
    filter === "completed"
      ? completed
      : filter === "inProgress"
        ? inProgress
        : records;
  const emptyTitle =
    filter === "completed"
      ? "완료된 사건이 없습니다"
      : filter === "inProgress"
        ? "진행 중인 사건이 없습니다"
        : "아직 기록이 없습니다";
  const emptyBody =
    filter === "completed"
      ? "사건을 끝까지 해결하면 여기에 기록됩니다."
      : filter === "inProgress"
        ? "새 사건을 시작하면 여기에 표시됩니다."
        : "사건을 시작하거나 최종 추리를 제출하면 이곳에 기록됩니다.";

  return (
    <section className="stack">
      <button className="icon-button fit" onClick={onBack} type="button">
        내 정보로 돌아가기
      </button>
      <ScreenTitle title="수사 기록" subtitle="MY RECORDS" />
      <div className="detective-grade-card">
        <div className="grade-mark">{completed.length >= 5 ? "A" : "B"}</div>
        <div>
          <h2>{completed.length >= 5 ? "주임 탐정" : "견습 탐정"}</h2>
          <p className="eyebrow">
            {completed.length >= 5
              ? "ASSOCIATE DETECTIVE"
              : "TRAINEE DETECTIVE"}
          </p>
          <p className="card-body">
            다음 등급까지 {Math.max(0, 5 - completed.length)}건 해결 필요
          </p>
        </div>
      </div>
      <div className="stats-grid">
        <Stat label="해결" value={`${completed.length}건`} />
        <Stat
          label="평균 점수"
          value={averageScore != null ? `${averageScore}` : "-"}
        />
        <Stat label="진행" value={`${inProgress.length}건`} />
      </div>
      <FilterChips
        label="기록 목록"
        options={[
          ["all", "전체"],
          ["completed", "완료"],
          ["inProgress", "진행 중"],
        ]}
        value={filter}
        onChange={(value) => setFilter(value as typeof filter)}
      />
      {!filtered.length && (
        <StateBlock title={emptyTitle} body={emptyBody} action={onLibrary} />
      )}
      <div className="records-list">
        {filtered.map((record) => (
          <article className="record-card" key={record.recordId}>
            <div>
              <p className="eyebrow">
                {record.status === "COMPLETED" ? "COMPLETED" : "IN PROGRESS"}
              </p>
              <h2>{record.scenarioTitle}</h2>
              <p className="muted">
                {record.status === "COMPLETED"
                  ? `${formatDateTime(record.completedAt ?? record.updatedAt)} 완료`
                  : `${formatDateTime(record.updatedAt)} 업데이트`}
              </p>
            </div>
            <div className="record-score">
              <strong>{record.grade ?? "-"}</strong>
              <span>
                {record.score != null ? `${record.score}점` : "진행 중"}
              </span>
              {record.status === "IN_PROGRESS" && (
                <button
                  className="chip"
                  onClick={() => onResume(record)}
                  type="button"
                >
                  이어하기
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LibraryScreen({
  scenarios,
  filter,
  loading,
  error,
  onRefresh,
  onFilterChange,
  onSelect,
}: {
  scenarios: Scenario[];
  filter: ScenarioFilterState;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onFilterChange: (filter: ScenarioFilterState) => void;
  onSelect: (scenario: Scenario) => void;
}) {
  const [query, setQuery] = useState(filter.query);
  const updateFilter = (next: Partial<ScenarioFilterState>) => {
    onFilterChange({ ...filter, ...next });
  };

  return (
    <section className="stack">
      <ScreenTitle title="시나리오 라이브러리" subtitle="MYSTERY LIBRARY" />
      <div className="search-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="사건명 또는 키워드"
          onKeyDown={(event) => {
            if (event.key === "Enter") updateFilter({ query });
          }}
        />
        <button
          className="button secondary compact"
          onClick={() => updateFilter({ query })}
          type="button"
        >
          검색
        </button>
      </div>
      <FilterChips
        label="정렬"
        options={[
          ["popular", "인기"],
          ["latest", "최신"],
          ["rating", "평점"],
        ]}
        value={filter.sort}
        onChange={(value) =>
          updateFilter({ sort: value as ScenarioFilterState["sort"] })
        }
      />
      <FilterChips
        label="유형"
        options={[
          ["", "전체"],
          ["OFFICIAL", "공식"],
          ["CUSTOM", "커스텀"],
        ]}
        value={filter.type}
        onChange={(value) =>
          updateFilter({ type: value as ScenarioFilterState["type"] })
        }
      />
      <FilterChips
        label="난이도"
        options={[
          ["", "전체"],
          ["EASY", "쉬움"],
          ["NORMAL", "보통"],
          ["HARD", "어려움"],
        ]}
        value={filter.difficulty}
        onChange={(value) =>
          updateFilter({
            difficulty: value as ScenarioFilterState["difficulty"],
          })
        }
      />
      <div className="meta-row">
        <span>{loading ? "검색 중" : `${scenarios.length}건`}</span>
        {filter.query && <span>키워드: {filter.query}</span>}
      </div>
      {loading && <StateBlock title="사건 목록을 불러오고 있습니다" />}
      {error && (
        <StateBlock
          title="불러오지 못했습니다"
          body={error}
          action={onRefresh}
        />
      )}
      <div className="card-list">
        {scenarios.map((scenario) => (
          <button
            className="scenario-card"
            key={scenario.scenarioId}
            onClick={() => onSelect(scenario)}
            type="button"
          >
            <div className="scenario-thumb">
              {scenario.thumbnailUrl ? (
                <img
                  src={scenario.thumbnailUrl}
                  alt={`${scenario.title} 대표 이미지`}
                />
              ) : (
                <span>CL</span>
              )}
            </div>
            <div>
              <div className="card-title">{scenario.title}</div>
              <p className="card-body">{scenario.description}</p>
              <div className="meta-row">
                <span>{formatDifficulty(scenario.difficulty)}</span>
                <span>{scenario.estimatedPlayTimeMinutes}분</span>
                <span>인물 {scenario.suspectCount}</span>
                <span>증거 {scenario.evidenceCount}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="filter-group">
      <span>{label}</span>
      <div className="chip-row">
        {options.map(([optionValue, text]) => (
          <button
            className={`chip ${value === optionValue ? "active" : ""}`}
            key={`${label}-${optionValue}`}
            onClick={() => onChange(optionValue)}
            aria-pressed={value === optionValue}
            type="button"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScenarioDetailScreen({
  scenario,
  bookmarked,
  reviews,
  loading,
  error,
  onBack,
  onStart,
  onToggleBookmark,
  onWriteReview,
  onOpenImage,
}: {
  scenario: Scenario;
  bookmarked: boolean;
  reviews: ScenarioReview[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onStart: () => void;
  onToggleBookmark: () => void;
  onWriteReview: () => void;
  onOpenImage: (preview: ImagePreview) => void;
}) {
  const averageLocalRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;

  return (
    <section className="stack">
      <div className="detail-actions">
        <button className="icon-button fit" onClick={onBack} type="button">
          라이브러리로 돌아가기
        </button>
        <button
          className={`icon-button fit ${bookmarked ? "active" : ""}`}
          onClick={onToggleBookmark}
          type="button"
        >
          {bookmarked ? "저장됨" : "저장"}
        </button>
      </div>
      <button
        className="image-button scenario-hero"
        disabled={!scenario.thumbnailUrl}
        aria-label={`${scenario.title} 이미지 크게 보기`}
        onClick={() => {
          if (scenario.thumbnailUrl) {
            onOpenImage({
              url: scenario.thumbnailUrl,
              title: scenario.title,
              subtitle: "시나리오 이미지",
            });
          }
        }}
        type="button"
      >
        {scenario.thumbnailUrl ? (
          <img
            src={scenario.thumbnailUrl}
            alt={`${scenario.title} 대표 이미지`}
          />
        ) : (
          <span>CL-{String(scenario.scenarioId).padStart(3, "0")}</span>
        )}
      </button>
      <div className="screen-title">
        <p className="eyebrow">
          {scenario.scenarioType === "CUSTOM" ? "CUSTOM CASE" : "OFFICIAL CASE"}
        </p>
        <h1>{scenario.title}</h1>
        <p className="muted">
          CL-{String(scenario.scenarioId).padStart(3, "0")}
        </p>
      </div>
      {loading && <StateBlock title="상세 정보를 불러오고 있습니다" />}
      {error && <p className="error-text">{error}</p>}
      <div className="stats-grid">
        <Stat label="난이도" value={formatDifficulty(scenario.difficulty)} />
        <Stat
          label="예상 시간"
          value={`${scenario.estimatedPlayTimeMinutes}분`}
        />
        <Stat
          label="평점"
          value={(averageLocalRating ?? scenario.averageRating).toFixed(1)}
        />
      </div>
      <div className="stats-grid">
        <Stat label="인물" value={`${scenario.suspectCount}명`} />
        <Stat label="증거" value={`${scenario.evidenceCount}개`} />
        <Stat label="플레이" value={`${scenario.playCount}회`} />
      </div>
      <InfoPanel
        title="시놉시스"
        body={
          scenario.synopsis || scenario.description || "사건 설명이 없습니다."
        }
      />
      {!!scenario.tags?.length && (
        <div className="chip-row">
          {scenario.tags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {scenario.author && <InfoPanel title="제작자" body={scenario.author} />}
      <ScenarioReviews
        scenario={scenario}
        reviews={reviews}
        onWriteReview={onWriteReview}
      />
      <button
        className="button primary"
        onClick={onStart}
        disabled={scenario.canPlay === false}
        type="button"
      >
        {scenario.canPlay === false ? "플레이할 수 없는 사건" : "수사 시작"}
      </button>
    </section>
  );
}

function ScenarioReviews({
  scenario,
  reviews,
  onWriteReview,
}: {
  scenario: Scenario;
  reviews: ScenarioReview[];
  onWriteReview: () => void;
}) {
  return (
    <article className="info-card">
      <div className="section-header">
        <div>
          <p className="mini-title">평점 · 리뷰</p>
          <p className="card-body">
            평균 {scenario.averageRating.toFixed(1)} · 플레이{" "}
            {scenario.playCount}회
          </p>
        </div>
        <button className="chip" onClick={onWriteReview} type="button">
          작성
        </button>
      </div>
      {!reviews.length && (
        <p className="card-body review-empty">
          아직 이 기기에 저장된 리뷰가 없습니다.
        </p>
      )}
      <div className="review-list">
        {reviews.map((review) => (
          <ReviewCard review={review} key={review.reviewId} />
        ))}
      </div>
    </article>
  );
}

function ReviewCard({ review }: { review: ScenarioReview }) {
  const [revealed, setRevealed] = useState(!review.isSpoiler);
  return (
    <article className={`review-card ${review.isSpoiler ? "spoiler" : ""}`}>
      <div className="review-head">
        <div>
          <strong>{review.authorName}</strong>
          <span>{formatDateTime(review.createdAt)}</span>
        </div>
        <b>★ {review.rating.toFixed(1)}</b>
      </div>
      {review.isSpoiler && !revealed ? (
        <button
          className="spoiler-cover"
          onClick={() => setRevealed(true)}
          type="button"
        >
          스포일러가 포함된 리뷰입니다. 눌러서 보기
        </button>
      ) : (
        <p>{review.body}</p>
      )}
    </article>
  );
}

function ReviewDialog({
  target,
  authorName,
  onCancel,
  onSubmit,
}: {
  target: ReviewDraftTarget;
  authorName: string;
  onCancel: () => void;
  onSubmit: (review: ScenarioReview) => void;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const canSubmit = body.trim().length > 0;

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <button
        className="modal-backdrop"
        onClick={onCancel}
        type="button"
        aria-label="닫기"
      />
      <div className="review-dialog">
        <div className="modal-handle" />
        <p className="eyebrow">REVIEW</p>
        <h2>{target.title}</h2>
        <label className="field-label" htmlFor="review-rating">
          평점 {rating.toFixed(1)}
        </label>
        <input
          id="review-rating"
          type="range"
          min="1"
          max="5"
          step="0.5"
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
        />
        <TextArea label="리뷰" value={body} onChange={setBody} />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={isSpoiler}
            onChange={(event) => setIsSpoiler(event.target.checked)}
          />
          <span>스포일러 포함</span>
        </label>
        <div className="dialog-actions">
          <button className="button ghost" onClick={onCancel} type="button">
            취소
          </button>
          <button
            className="button primary"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                reviewId: `review-${Date.now()}`,
                scenarioId: target.scenarioId,
                authorName,
                rating,
                body: body.trim(),
                createdAt: new Date().toISOString(),
                isSpoiler,
              })
            }
            type="button"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

function CaseBriefingScreen({
  scenario,
  onBack,
  onStart,
}: {
  scenario: Scenario;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <section className="stack">
      <button className="icon-button fit" onClick={onBack} type="button">
        사건 상세로 돌아가기
      </button>
      <ScreenTitle title="수사 브리핑" subtitle="CASE BRIEFING" />
      <div className="briefing-panel">
        <p className="eyebrow">
          CL-{String(scenario.scenarioId).padStart(3, "0")}
        </p>
        <h1>{scenario.title}</h1>
        <p>
          {scenario.synopsis ||
            scenario.description ||
            "사건 개요를 확인하세요."}
        </p>
      </div>
      <div className="stats-grid">
        <Stat label="난이도" value={formatDifficulty(scenario.difficulty)} />
        <Stat
          label="예상 시간"
          value={`${scenario.estimatedPlayTimeMinutes}분`}
        />
        <Stat label="제출 증거" value="1~15개" />
      </div>
      <InfoPanel
        title="수사 목표"
        body="인물을 심문하고 증거를 비교해 범인, 동기, 수법, 은폐 방식을 정리하세요."
      />
      <InfoPanel
        title="주의"
        body="추천 질문은 입력창에만 채워집니다. 전송 버튼을 눌러야 AI 심문이 진행됩니다."
      />
      <button className="button primary" onClick={onStart} type="button">
        수사 시작
      </button>
    </section>
  );
}

function CaseScreen({
  caseTab,
  setCaseTab,
  dashboard,
  evidences,
  suspects,
  timeline,
  locations,
  mapImageUrl,
  hints,
  loading,
  error,
  onRetry,
  onEvidenceDetail,
  onSuspectDetail,
  onOpenImage,
  onUseHint,
  onAbandon,
  onSubmit,
}: {
  caseTab: "scene" | "evidence" | "suspects" | "timeline";
  setCaseTab: (tab: "scene" | "evidence" | "suspects" | "timeline") => void;
  dashboard: Dashboard | null;
  evidences: Evidence[];
  suspects: Suspect[];
  timeline: TimelineEvent[];
  locations: CaseLocation[];
  mapImageUrl?: string;
  hints: Hint[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEvidenceDetail: (evidence: Evidence) => void;
  onSuspectDetail: (suspect: Suspect) => void;
  onOpenImage: (preview: ImagePreview) => void;
  onUseHint: (hint: Hint) => void;
  onAbandon: () => void;
  onSubmit: () => void;
}) {
  if (loading && !dashboard)
    return <StateBlock title="세션을 준비하고 있습니다" />;
  if (error && !dashboard) {
    return (
      <StateBlock
        title="수사를 시작하지 못했습니다"
        body={error}
        action={onRetry}
      />
    );
  }

  return (
    <section className="case-layout">
      <div className="hud">
        <div>
          <p className="eyebrow">CASE FILE</p>
          <h2>{dashboard?.scenarioTitle ?? "수사 중"}</h2>
        </div>
        <div className="hud-stats">
          <Stat
            label="시간"
            value={formatTime(dashboard?.elapsedSeconds ?? 0)}
          />
          <Stat
            label="증거"
            value={`${dashboard?.unlockedEvidenceCount ?? 0}/${dashboard?.totalEvidenceCount ?? 0}`}
          />
        </div>
      </div>

      <div className="tabbar">
        {[
          ["scene", "현장"],
          ["evidence", "증거"],
          ["suspects", "인물"],
          ["timeline", "타임라인"],
        ].map(([key, label]) => (
          <button
            className={caseTab === key ? "active" : ""}
            key={key}
            onClick={() => setCaseTab(key as typeof caseTab)}
            aria-pressed={caseTab === key}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {caseTab === "scene" && (
        <div className="stack">
          <InfoPanel
            title="브리핑"
            body={dashboard?.briefing?.summary || "브리핑을 불러오는 중입니다."}
          />
          <div className="stats-grid">
            <Stat
              label="피해자"
              value={dashboard?.briefing?.victimName ?? "-"}
            />
            <Stat
              label="장소"
              value={dashboard?.briefing?.foundLocation ?? "-"}
            />
            <Stat
              label="심문"
              value={`${dashboard?.interrogationCount ?? 0}회`}
            />
          </div>
          <button className="button primary" onClick={onSubmit} type="button">
            최종 추리 제출
          </button>
          <button className="button ghost" onClick={onAbandon} type="button">
            수사 중단
          </button>
          <LocationPanel
            locations={locations}
            mapImageUrl={mapImageUrl}
            onOpenImage={onOpenImage}
          />
          <HintPanel hints={hints} onUseHint={onUseHint} />
        </div>
      )}

      {caseTab === "evidence" && (
        <EvidenceList
          evidences={evidences}
          onEvidenceDetail={onEvidenceDetail}
        />
      )}

      {caseTab === "suspects" && (
        <SuspectList suspects={suspects} onSuspectDetail={onSuspectDetail} />
      )}

      {caseTab === "timeline" && <TimelineList events={timeline} />}
    </section>
  );
}

function LocationPanel({
  locations,
  mapImageUrl,
  onOpenImage,
}: {
  locations: CaseLocation[];
  mapImageUrl?: string;
  onOpenImage: (preview: ImagePreview) => void;
}) {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  if (!locations.length) return null;
  const selected =
    locations.find((location) => location.locationId === selectedLocationId) ??
    locations[0];
  const markerLocations = locations.filter(
    (location) =>
      typeof location.mapX === "number" && typeof location.mapY === "number",
  );

  return (
    <article className="info-card">
      <p className="mini-title">현장 보드</p>
      <button
        className="scene-map"
        disabled={!mapImageUrl}
        aria-label="현장 지도 크게 보기"
        onClick={() => {
          if (mapImageUrl) {
            onOpenImage({
              url: mapImageUrl,
              title: "현장 지도",
              subtitle: "CRIME SCENE",
            });
          }
        }}
        type="button"
      >
        {mapImageUrl ? (
          <img src={mapImageUrl} alt="현장 지도" />
        ) : (
          <span>MAP</span>
        )}
        {markerLocations.map((location) => (
          <span
            className={`map-marker ${location.locationId === selected.locationId ? "active" : ""}`}
            key={location.locationId}
            style={{
              left: `${Math.max(0, Math.min(1, location.mapX ?? 0)) * 100}%`,
              top: `${Math.max(0, Math.min(1, location.mapY ?? 0)) * 100}%`,
            }}
          >
            {location.unlockedEvidenceCount}
          </span>
        ))}
      </button>
      <div className="location-grid">
        {locations.map((location) => (
          <button
            className={`location-card ${
              location.locationId === selected.locationId ? "active" : ""
            }`}
            key={location.locationId}
            onClick={() => setSelectedLocationId(location.locationId)}
            type="button"
          >
            {location.imageUrl ? (
              <img src={location.imageUrl} alt={`${location.name} 이미지`} />
            ) : (
              <span className="location-placeholder">SC</span>
            )}
            <div>
              <strong>{location.name}</strong>
              <p>
                {location.description || location.floor || "현장 정보 확인 중"}
              </p>
              <span>
                증거 {location.unlockedEvidenceCount}/
                {location.totalEvidenceCount}
              </span>
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="location-detail">
          <div>
            <p className="mini-title">{selected.name}</p>
            <p className="card-body">
              {selected.description || selected.floor || "현장 정보 확인 중"}
            </p>
          </div>
          {selected.imageUrl && (
            <button
              className="chip"
              aria-label={`${selected.name} 이미지 크게 보기`}
              onClick={() =>
                onOpenImage({
                  url: selected.imageUrl!,
                  title: selected.name,
                  subtitle: selected.floor ?? "장소 이미지",
                })
              }
              type="button"
            >
              이미지 보기
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function HintPanel({
  hints,
  onUseHint,
}: {
  hints: Hint[];
  onUseHint: (hint: Hint) => void;
}) {
  if (!hints.length) return null;

  return (
    <article className="info-card">
      <p className="mini-title">수사 힌트</p>
      <div className="hint-list">
        {hints.map((hint) => (
          <div className="hint-card" key={hint.hintId}>
            <div>
              <strong>힌트 {hint.hintLevel}</strong>
              <p>
                {hint.isUsed
                  ? hint.content || "사용한 힌트입니다."
                  : hint.isAvailable
                    ? `사용 시 ${hint.penaltyScore}점이 차감됩니다.`
                    : hint.remainingMinutes != null
                      ? `${hint.remainingMinutes}분 후 사용할 수 있습니다.`
                      : "아직 사용할 수 없습니다."}
              </p>
            </div>
            {!hint.isUsed && (
              <button
                className="chip"
                disabled={!hint.isAvailable}
                onClick={() => onUseHint(hint)}
                type="button"
              >
                사용
              </button>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

function EvidenceList({
  evidences,
  onEvidenceDetail,
}: {
  evidences: Evidence[];
  onEvidenceDetail: (evidence: Evidence) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const filtered = [...evidences]
    .sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      return a.title.localeCompare(b.title);
    })
    .filter((evidence) => {
      const keyword = query.trim();
      const matchesQuery =
        !keyword ||
        evidence.title.includes(keyword) ||
        (evidence.locationName ?? "").includes(keyword) ||
        (evidence.categoryLabel ?? evidence.category ?? "").includes(keyword);
      const matchesFilter =
        filter === "all" ||
        (filter === "unlocked" && evidence.isUnlocked) ||
        (filter === "locked" && !evidence.isUnlocked);
      return matchesQuery && matchesFilter;
    });

  return (
    <div className="stack">
      <div className="search-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="증거 이름 · 장소 검색"
        />
      </div>
      <FilterChips
        label="상태"
        options={[
          ["all", "전체"],
          ["unlocked", "확보됨"],
          ["locked", "잠김"],
        ]}
        value={filter}
        onChange={(value) => setFilter(value as typeof filter)}
      />
      <div className="meta-row">
        <span>{filtered.length}개</span>
        {query.trim() && <span>검색: {query.trim()}</span>}
      </div>
      {!filtered.length && (
        <StateBlock
          title="일치하는 증거가 없습니다"
          body="검색어나 필터를 바꿔 보세요."
        />
      )}
      <div className="card-list">
        {filtered.map((evidence) => (
          <button
            className={`info-card evidence-card ${evidence.isUnlocked ? "" : "locked"}`}
            key={evidence.evidenceId}
            onClick={() => onEvidenceDetail(evidence)}
            type="button"
          >
            <div className="row">
              <div className="evidence-thumb">
                {evidence.imageUrl ? (
                  <img
                    src={evidence.imageUrl}
                    alt={`${evidence.title} 이미지`}
                  />
                ) : (
                  "EV"
                )}
              </div>
              <div>
                <div className="card-title">
                  {evidence.isUnlocked ? evidence.title : "잠긴 증거"}
                </div>
                <p className="card-body">
                  {evidence.isUnlocked
                    ? evidence.oneLine ||
                      evidence.description ||
                      "증거 설명이 없습니다."
                    : evidence.unlockHint ||
                      "수사를 진행하면 확인할 수 있습니다."}
                </p>
                <div className="meta-row">
                  <span>{evidence.locationName ?? "위치 미상"}</span>
                  <span>
                    {evidence.categoryLabel ?? evidence.category ?? "증거"}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function GuidanceBlock({
  guidance,
  suspects,
  onChat,
  onCompareEvidence,
}: {
  guidance: Guidance;
  suspects: Suspect[];
  onChat: (suspect: Suspect, prefill?: SuggestedQuestion) => void;
  onCompareEvidence?: (evidenceId: number) => void;
}) {
  return (
    <div className="guidance">
      {!!guidance.readingPoints?.length && (
        <>
          <p className="mini-title">이 증거에서 볼 점</p>
          <ul>
            {guidance.readingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </>
      )}
      {!!guidance.compareEvidences?.length && (
        <>
          <p className="mini-title">함께 비교할 증거</p>
          <div className="chip-row">
            {guidance.compareEvidences.map((item, index) => (
              <button
                className="chip"
                disabled={!item.isUnlocked || !item.evidenceId}
                key={`${item.evidenceId ?? index}`}
                onClick={() => {
                  if (item.evidenceId) onCompareEvidence?.(item.evidenceId);
                }}
                type="button"
              >
                {item.isUnlocked
                  ? item.title || "증거"
                  : item.unlockHint || "잠긴 증거"}
              </button>
            ))}
          </div>
        </>
      )}
      {!!guidance.suggestedQuestions?.length && (
        <>
          <p className="mini-title">심문에 활용할 질문</p>
          <div className="question-stack">
            {guidance.suggestedQuestions.map((q) => {
              const target = suspects.find(
                (s) => s.suspectId === q.targetSuspectId,
              );
              if (!target) return null;
              return (
                <button
                  className="question-chip"
                  key={`${q.targetSuspectId}-${q.question}`}
                  onClick={() => onChat(target, q)}
                  type="button"
                >
                  {target.name}: {q.question}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EvidenceDetailScreen({
  evidence,
  suspects,
  evidences,
  loading,
  error,
  onBack,
  onOpenImage,
  onCompareEvidence,
  onChat,
}: {
  evidence: Evidence;
  suspects: Suspect[];
  evidences: Evidence[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onOpenImage: (preview: ImagePreview) => void;
  onCompareEvidence: (evidenceId: number) => void;
  onChat: (suspect: Suspect, prefill?: SuggestedQuestion) => void;
}) {
  const relatedSuspects = evidence.relatedSuspects
    ?.map((related) => suspects.find((s) => s.suspectId === related.suspectId))
    .filter((suspect): suspect is Suspect => !!suspect);

  return (
    <section className="stack">
      <button className="icon-button fit" onClick={onBack} type="button">
        증거 목록으로 돌아가기
      </button>
      <button
        className="image-button evidence-hero"
        disabled={!evidence.imageUrl}
        aria-label={`${evidence.title} 이미지 크게 보기`}
        onClick={() => {
          if (evidence.imageUrl) {
            onOpenImage({
              url: evidence.imageUrl,
              title: evidence.isUnlocked ? evidence.title : "잠긴 증거",
              subtitle: evidence.locationName ?? "증거 이미지",
            });
          }
        }}
        type="button"
      >
        {evidence.imageUrl ? (
          <img src={evidence.imageUrl} alt={`${evidence.title} 이미지`} />
        ) : (
          <span>{evidence.isUnlocked ? "EV" : "LOCKED"}</span>
        )}
      </button>
      <ScreenTitle
        title={evidence.isUnlocked ? evidence.title : "잠긴 증거"}
        subtitle="EVIDENCE"
      />
      <div className="meta-row">
        <span>{evidence.isUnlocked ? "확보됨" : "잠김"}</span>
        <span>{evidence.locationName ?? "위치 미상"}</span>
        <span>{evidence.categoryLabel ?? evidence.category ?? "증거"}</span>
      </div>
      {loading && <StateBlock title="증거 상세를 불러오고 있습니다" />}
      {error && <p className="error-text">{error}</p>}
      <InfoPanel
        title="관찰 기록"
        body={
          evidence.isUnlocked
            ? evidence.description ||
              evidence.oneLine ||
              "아직 공개된 설명이 없습니다."
            : evidence.unlockHint || "수사를 진행하면 확인할 수 있습니다."
        }
      />
      {!!relatedSuspects?.length && (
        <article className="info-card">
          <p className="mini-title">관련 인물</p>
          <div className="chip-row">
            {relatedSuspects.map((suspect) => (
              <button
                className="chip"
                key={suspect.suspectId}
                onClick={() =>
                  onChat(suspect, {
                    targetSuspectId: suspect.suspectId,
                    question: `${evidence.title}에 대해 알고 있는 것을 말해 주세요.`,
                    presentedEvidenceId: evidence.evidenceId,
                    questionType: "EVIDENCE_PRESENTED",
                  })
                }
                type="button"
              >
                {suspect.name}
              </button>
            ))}
          </div>
        </article>
      )}
      {!!evidence.relatedTimelineEvents?.length && (
        <article className="info-card">
          <p className="mini-title">관련 타임라인</p>
          <TimelineList events={evidence.relatedTimelineEvents} />
        </article>
      )}
      {evidence.guidance && (
        <article className="info-card">
          <GuidanceBlock
            guidance={evidence.guidance}
            suspects={suspects}
            onChat={onChat}
            onCompareEvidence={onCompareEvidence}
          />
        </article>
      )}
      {evidence.isUnlocked && (
        <article className="info-card">
          <p className="mini-title">증거 제시</p>
          <p className="card-body">
            심문 대상에게 이 증거를 제시하려면 관련 인물 또는 질문을 선택하세요.
          </p>
          <div className="chip-row">
            {suspects
              .filter((suspect) => !suspect.isWitness)
              .slice(0, 6)
              .map((suspect) => (
                <button
                  className="chip"
                  key={suspect.suspectId}
                  onClick={() =>
                    onChat(suspect, {
                      targetSuspectId: suspect.suspectId,
                      question: `${evidence.title}을 보고 설명해 주세요.`,
                      presentedEvidenceId: evidence.evidenceId,
                      questionType: "EVIDENCE_PRESENTED",
                    })
                  }
                  type="button"
                >
                  {suspect.name}
                </button>
              ))}
          </div>
        </article>
      )}
      {!!evidences.length && (
        <p className="muted">확보/잠긴 증거 {evidences.length}개 중 선택됨</p>
      )}
    </section>
  );
}

function SuspectList({
  suspects,
  onSuspectDetail,
}: {
  suspects: Suspect[];
  onSuspectDetail: (suspect: Suspect) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "suspect" | "witness">("all");
  const suspectCount = suspects.filter((suspect) => !suspect.isWitness).length;
  const witnessCount = suspects.filter((suspect) => suspect.isWitness).length;
  const interrogationCount = suspects.reduce(
    (sum, suspect) => sum + (suspect.interrogationCount ?? 0),
    0,
  );
  const filtered = [...suspects]
    .sort((a, b) => {
      if ((a.isWitness ?? false) !== (b.isWitness ?? false)) {
        return a.isWitness ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    })
    .filter((suspect) => {
      const keyword = query.trim();
      const matchesQuery =
        !keyword ||
        suspect.name.includes(keyword) ||
        (suspect.role ?? "").includes(keyword) ||
        (suspect.relationToVictim ?? "").includes(keyword);
      const matchesFilter =
        filter === "all" ||
        (filter === "suspect" && !suspect.isWitness) ||
        (filter === "witness" && suspect.isWitness);
      return matchesQuery && matchesFilter;
    });

  return (
    <div className="stack">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="인물 이름 · 역할 검색"
      />
      <FilterChips
        label="인물 유형"
        options={[
          ["all", "전체"],
          ["suspect", "용의자"],
          ["witness", "증인"],
        ]}
        value={filter}
        onChange={(value) => setFilter(value as typeof filter)}
      />
      <div className="stats-grid">
        <Stat label="용의자" value={`${suspectCount}명`} />
        <Stat label="증인" value={`${witnessCount}명`} />
        <Stat label="심문" value={`${interrogationCount}회`} />
      </div>
      <div className="meta-row">
        <span>{filtered.length}명</span>
        {query.trim() && <span>검색: {query.trim()}</span>}
      </div>
      {!filtered.length && (
        <StateBlock
          title="일치하는 인물이 없습니다"
          body="검색어나 필터를 바꿔 보세요."
        />
      )}
      <div className="card-list">
        {filtered.map((suspect) => (
          <button
            className="suspect-card"
            key={suspect.suspectId}
            onClick={() => onSuspectDetail(suspect)}
            type="button"
          >
            <Avatar suspect={suspect} />
            <div>
              <div className="card-title">{suspect.name}</div>
              <p className="card-body">
                {suspect.role ?? "역할 미상"}
                {suspect.relationToVictim
                  ? ` · ${suspect.relationToVictim}`
                  : ""}
              </p>
              <div className="meta-row">
                <span>{suspect.isWitness ? "증인" : "용의자"}</span>
                <span>심문 {suspect.interrogationCount ?? 0}회</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuspectDetailScreen({
  suspect,
  evidences,
  logs,
  loading,
  onBack,
  onChat,
  onSelectCulprit,
  onEvidenceDetail,
}: {
  suspect: Suspect;
  evidences: Evidence[];
  logs: InterrogationLog[];
  loading: boolean;
  onBack: () => void;
  onChat: () => void;
  onSelectCulprit: () => void;
  onEvidenceDetail: (evidence: Evidence) => void;
}) {
  const relatedEvidences = evidences.filter((evidence) =>
    evidence.relatedSuspects?.some(
      (related) => related.suspectId === suspect.suspectId,
    ),
  );

  return (
    <section className="stack">
      <button className="icon-button fit" onClick={onBack} type="button">
        인물 목록으로 돌아가기
      </button>
      <div className="suspect-profile">
        <Avatar suspect={suspect} />
        <p className="eyebrow">{suspect.isWitness ? "WITNESS" : "SUSPECT"}</p>
        <h1>{suspect.name}</h1>
        <p className="muted">
          {suspect.role ?? "역할 미상"}
          {suspect.relationToVictim ? ` · ${suspect.relationToVictim}` : ""}
        </p>
        {suspect.personalityTone && (
          <span className="chip active">{suspect.personalityTone}</span>
        )}
      </div>
      {suspect.relationToVictim && (
        <InfoPanel title="피해자와의 관계" body={suspect.relationToVictim} />
      )}
      <InfoPanel
        title="진술"
        body={suspect.publicStatement || "아직 공개된 진술이 없습니다."}
      />
      <InfoPanel
        title="알리바이"
        body={
          suspect.publicAlibi || suspect.alibi || "확인된 알리바이가 없습니다."
        }
      />
      {!!relatedEvidences.length && (
        <article className="info-card">
          <p className="mini-title">관련 증거</p>
          <div className="card-list compact">
            {relatedEvidences.map((evidence) => (
              <button
                className="evidence-row"
                key={evidence.evidenceId}
                onClick={() => onEvidenceDetail(evidence)}
                type="button"
              >
                <span>
                  {evidence.isUnlocked ? evidence.title : "잠긴 증거"}
                </span>
                <small>{evidence.locationName ?? "위치 미상"}</small>
              </button>
            ))}
          </div>
        </article>
      )}
      <article className="info-card">
        <p className="mini-title">이전 심문</p>
        {loading && <p className="card-body">심문 기록을 불러오고 있습니다.</p>}
        {!loading && !logs.length && (
          <p className="card-body">아직 이 인물에게 진행한 심문이 없습니다.</p>
        )}
        <div className="log-list">
          {logs.map((log) => (
            <div className="log-item" key={log.interrogationId}>
              <strong>Q. {log.question}</strong>
              <p>{log.answer}</p>
              {log.presentedEvidence && (
                <span>제시 증거: {log.presentedEvidence.title}</span>
              )}
            </div>
          ))}
        </div>
      </article>
      <button className="button primary" onClick={onChat} type="button">
        심문하기
      </button>
      {!suspect.isWitness && (
        <button
          className="button secondary"
          onClick={onSelectCulprit}
          type="button"
        >
          최종 추리 후보로 선택
        </button>
      )}
    </section>
  );
}

function ChatScreen({
  suspect,
  messages,
  question,
  setQuestion,
  pendingEvidence,
  evidences,
  loading,
  onBack,
  onPrefill,
  onAttachEvidence,
  onClearEvidence,
  onSend,
}: {
  suspect: Suspect;
  messages: ChatMessage[];
  question: string;
  setQuestion: (value: string) => void;
  pendingEvidence?: Evidence;
  evidences: Evidence[];
  loading: boolean;
  onBack: () => void;
  onPrefill: (question: string) => void;
  onAttachEvidence: (evidenceId: number) => void;
  onClearEvidence: () => void;
  onSend: () => void;
}) {
  const [evidencePickerOpen, setEvidencePickerOpen] = useState(false);
  const canned = [
    "그 시간에 어디에 있었나요?",
    "피해자와 마지막으로 나눈 대화는 무엇인가요?",
    "이 진술과 맞지 않는 부분을 설명해 주세요.",
  ];

  return (
    <section className="chat-screen">
      <div className="chat-header">
        <button className="icon-button" onClick={onBack} type="button">
          뒤로
        </button>
        <Avatar suspect={suspect} />
        <div>
          <div className="card-title">{suspect.name}</div>
          <p className="card-body">{suspect.role ?? "심문 대상"}</p>
        </div>
      </div>
      <div className="message-list">
        {messages.map((message, index) => (
          <div className={`bubble ${message.sender}`} key={index}>
            {message.presentedEvidenceId && (
              <span className="bubble-kicker">증거 제시</span>
            )}
            {message.text}
          </div>
        ))}
        {loading && (
          <div className="bubble suspect">답변을 정리하고 있습니다.</div>
        )}
      </div>
      <div className="chip-row">
        {canned.map((item) => (
          <button
            className="chip button-chip"
            key={item}
            onClick={() => onPrefill(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <button
        className="button ghost"
        onClick={() => setEvidencePickerOpen(true)}
        disabled={!evidences.length}
        type="button"
      >
        {pendingEvidence ? "제시 증거 변경" : "제시할 증거 선택"}
      </button>
      {pendingEvidence && (
        <div className="attached-evidence">
          증거 연동됨: {pendingEvidence.title}
          <button onClick={onClearEvidence} type="button">
            해제
          </button>
        </div>
      )}
      <div className="input-row">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="질문을 입력하세요"
        />
        <button
          className="button primary"
          onClick={onSend}
          disabled={loading}
          type="button"
        >
          전송
        </button>
      </div>
      {evidencePickerOpen && (
        <EvidencePickerDialog
          evidences={evidences}
          selectedEvidenceId={pendingEvidence?.evidenceId}
          onCancel={() => setEvidencePickerOpen(false)}
          onSelect={(evidenceId) => {
            onAttachEvidence(evidenceId);
            setEvidencePickerOpen(false);
          }}
        />
      )}
    </section>
  );
}

function EvidencePickerDialog({
  evidences,
  selectedEvidenceId,
  onCancel,
  onSelect,
}: {
  evidences: Evidence[];
  selectedEvidenceId?: number;
  onCancel: () => void;
  onSelect: (evidenceId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = evidences.filter((evidence) => {
    const keyword = query.trim();
    return (
      !keyword ||
      evidence.title.includes(keyword) ||
      (evidence.locationName ?? "").includes(keyword) ||
      (evidence.categoryLabel ?? evidence.category ?? "").includes(keyword)
    );
  });

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <button
        className="modal-backdrop"
        onClick={onCancel}
        type="button"
        aria-label="닫기"
      />
      <div className="evidence-picker-dialog">
        <div className="modal-handle" />
        <div className="section-header">
          <div>
            <p className="eyebrow">PRESENT EVIDENCE</p>
            <h2>제시할 증거 선택</h2>
          </div>
          <button className="icon-button" onClick={onCancel} type="button">
            닫기
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="보유한 증거 검색"
        />
        {!filtered.length && (
          <StateBlock
            title="일치하는 증거가 없습니다"
            body="다른 검색어를 입력하세요."
          />
        )}
        <div className="picker-list">
          {filtered.map((evidence) => (
            <button
              className={`picker-row ${
                evidence.evidenceId === selectedEvidenceId ? "active" : ""
              }`}
              key={evidence.evidenceId}
              onClick={() => onSelect(evidence.evidenceId)}
              type="button"
            >
              <div className="evidence-thumb">
                {evidence.imageUrl ? (
                  <img
                    src={evidence.imageUrl}
                    alt={`${evidence.title} 이미지`}
                  />
                ) : (
                  "EV"
                )}
              </div>
              <div>
                <strong>{evidence.title}</strong>
                <p>
                  {evidence.locationName ?? "위치 미상"} ·{" "}
                  {evidence.categoryLabel ?? evidence.category ?? "증거"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubmitScreen({
  suspects,
  evidences,
  selectedCulpritId,
  setSelectedCulpritId,
  selectedEvidenceIds,
  setSelectedEvidenceIds,
  motiveText,
  setMotiveText,
  methodText,
  setMethodText,
  coverUpText,
  setCoverUpText,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  suspects: Suspect[];
  evidences: Evidence[];
  selectedCulpritId: number | null;
  setSelectedCulpritId: (id: number | null) => void;
  selectedEvidenceIds: number[];
  setSelectedEvidenceIds: (ids: number[]) => void;
  motiveText: string;
  setMotiveText: (value: string) => void;
  methodText: string;
  setMethodText: (value: string) => void;
  coverUpText: string;
  setCoverUpText: (value: string) => void;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const selectedSuspect = suspects.find(
    (suspect) => suspect.suspectId === selectedCulpritId,
  );
  const selectedEvidences = evidences.filter((evidence) =>
    selectedEvidenceIds.includes(evidence.evidenceId),
  );
  const canSubmit =
    !!selectedCulpritId &&
    motiveText.trim() &&
    methodText.trim() &&
    coverUpText.trim() &&
    selectedEvidenceIds.length >= 1 &&
    selectedEvidenceIds.length <= 15;

  return (
    <section className="stack">
      <button
        className="icon-button fit"
        onClick={onBack}
        disabled={submitting}
        type="button"
      >
        수사로 돌아가기
      </button>
      <ScreenTitle title="최종 추리" subtitle="FINAL DEDUCTION" />
      <InfoPanel
        title="제출 조건"
        body="범인, 동기, 수법, 은폐 방식, 증거를 입력하세요."
      />
      <SubmitChecklist
        items={[
          ["진범 지목", !!selectedCulpritId],
          ["동기 입력", !!motiveText.trim()],
          ["수법 입력", !!methodText.trim()],
          ["은폐 입력", !!coverUpText.trim()],
          [
            "제출 증거 1~15개",
            selectedEvidenceIds.length >= 1 && selectedEvidenceIds.length <= 15,
          ],
        ]}
      />
      <label className="field-label">범인 지목</label>
      <select
        className="select"
        value={selectedCulpritId ?? ""}
        onChange={(e) => setSelectedCulpritId(Number(e.target.value) || null)}
      >
        <option value="">선택하세요</option>
        {suspects.map((suspect) => (
          <option key={suspect.suspectId} value={suspect.suspectId}>
            {suspect.name}
          </option>
        ))}
      </select>
      <TextArea label="동기" value={motiveText} onChange={setMotiveText} />
      <TextArea label="수법" value={methodText} onChange={setMethodText} />
      <TextArea label="은폐" value={coverUpText} onChange={setCoverUpText} />
      <label className="field-label">
        제출 증거 {selectedEvidenceIds.length}/15
      </label>
      {!!selectedEvidences.length && (
        <div className="selected-summary">
          {selectedEvidences.map((evidence) => (
            <button
              className="chip active"
              key={evidence.evidenceId}
              onClick={() =>
                setSelectedEvidenceIds(
                  selectedEvidenceIds.filter(
                    (id) => id !== evidence.evidenceId,
                  ),
                )
              }
              type="button"
            >
              {evidence.title}
            </button>
          ))}
        </div>
      )}
      <div className="evidence-picker">
        {evidences.map((evidence) => {
          const active = selectedEvidenceIds.includes(evidence.evidenceId);
          const disabled = !active && selectedEvidenceIds.length >= 15;
          return (
            <button
              className={`chip ${active ? "active" : ""}`}
              disabled={disabled}
              key={evidence.evidenceId}
              onClick={() => {
                setSelectedEvidenceIds(
                  active
                    ? selectedEvidenceIds.filter(
                        (id) => id !== evidence.evidenceId,
                      )
                    : [...selectedEvidenceIds, evidence.evidenceId],
                );
              }}
              type="button"
            >
              {evidence.title}
            </button>
          );
        })}
      </div>
      {error && <p className="error-text">{error}</p>}
      <button
        className="button primary"
        onClick={() => setConfirmOpen(true)}
        disabled={!canSubmit || submitting}
        type="button"
      >
        {submitting ? "제출 중" : "최종 추리 제출"}
      </button>
      {confirmOpen && (
        <SubmitConfirmDialog
          suspectName={selectedSuspect?.name ?? "선택한 인물"}
          evidenceCount={selectedEvidenceIds.length}
          submitting={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            onSubmit();
          }}
        />
      )}
    </section>
  );
}

function SubmitChecklist({ items }: { items: [string, boolean][] }) {
  return (
    <div className="submit-checklist">
      {items.map(([label, met]) => (
        <div className={`submit-check ${met ? "met" : ""}`} key={label}>
          <span>{met ? "OK" : "대기"}</span>
          <strong>{label}</strong>
        </div>
      ))}
    </div>
  );
}

function SubmitConfirmDialog({
  suspectName,
  evidenceCount,
  submitting,
  onCancel,
  onConfirm,
}: {
  suspectName: string;
  evidenceCount: number;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <button
        className="modal-backdrop"
        onClick={onCancel}
        disabled={submitting}
        type="button"
        aria-label="닫기"
      />
      <div className="confirm-dialog">
        <p className="eyebrow">FINAL DEDUCTION</p>
        <h2>최종 추리를 제출할까요?</h2>
        <p className="card-body">
          제출 후에는 이 세션의 답안을 다시 수정할 수 없습니다.
        </p>
        <div className="stats-grid">
          <Stat label="지목" value={suspectName} />
          <Stat label="증거" value={`${evidenceCount}개`} />
          <Stat label="상태" value="채점" />
        </div>
        <div className="dialog-actions">
          <button
            className="button ghost"
            onClick={onCancel}
            disabled={submitting}
            type="button"
          >
            더 확인
          </button>
          <button
            className="button primary"
            onClick={onConfirm}
            disabled={submitting}
            type="button"
          >
            제출
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  result,
  onHome,
  onLibrary,
  onWriteReview,
}: {
  result: Result | null;
  onHome: () => void;
  onLibrary: () => void;
  onWriteReview?: () => void;
}) {
  if (!result) {
    return (
      <StateBlock
        title="결과 세션이 없습니다"
        body="결과를 다시 확인해 주세요."
        action={onHome}
      />
    );
  }

  return (
    <section className="stack">
      <ScreenTitle title="수사 결과" subtitle="RESULT" />
      <div className="score-card">
        <span>{result.grade}</span>
        <strong>{result.score}</strong>
        <small>점</small>
      </div>
      <InfoPanel
        title="피드백"
        body={result.feedback || "결과 피드백을 확인하세요."}
      />
      {result.fullExplanation && (
        <InfoPanel title="해설" body={result.fullExplanation} />
      )}
      {result.correctCulprit && (
        <InfoPanel
          title="정답 범인"
          body={`${result.correctCulprit.name}${result.correctCulprit.role ? ` · ${result.correctCulprit.role}` : ""}`}
        />
      )}
      <article className="info-card">
        <p className="mini-title">채점 요약</p>
        <div className="result-match-list">
          <ResultMatchRow
            label="범인"
            matched={result.matched?.culprit === true}
          />
          <ResultMatchRow
            label="동기"
            matched={result.matched?.motive === true}
          />
          <ResultMatchRow
            label="수법"
            matched={result.matched?.method === true}
          />
          <ResultMatchRow
            label="은폐"
            matched={result.matched?.coverUp === true}
          />
        </div>
      </article>
      {!!result.matchedParts?.length && (
        <article className="info-card">
          <p className="mini-title">맞힌 항목</p>
          <div className="chip-row">
            {result.matchedParts.map((part) => (
              <span className="chip active" key={part}>
                {part}
              </span>
            ))}
          </div>
        </article>
      )}
      {!!result.missedParts?.length && (
        <article className="info-card">
          <p className="mini-title">보완할 항목</p>
          <div className="chip-row">
            {result.missedParts.map((part) => (
              <span className="chip" key={part}>
                {part}
              </span>
            ))}
          </div>
        </article>
      )}
      {!!result.keyEvidences?.length && (
        <article className="info-card">
          <p className="mini-title">핵심 증거 회고</p>
          <div className="card-list compact">
            {result.keyEvidences.map((evidence, index) => (
              <div
                className="evidence-row static"
                key={`${evidence.evidenceId ?? index}-${evidence.title}`}
              >
                <span>{evidence.title}</span>
                <small>결과 기준</small>
              </div>
            ))}
          </div>
        </article>
      )}
      {!!result.nextRecommendedScenarios?.length && (
        <article className="info-card">
          <p className="mini-title">다음 추천 사건</p>
          <div className="recommendation-list">
            {result.nextRecommendedScenarios.map((scenario) => (
              <div className="recommendation-card" key={scenario.scenarioId}>
                {scenario.thumbnailUrl ? (
                  <img
                    src={scenario.thumbnailUrl}
                    alt={`${scenario.title} 대표 이미지`}
                  />
                ) : (
                  <span>CL</span>
                )}
                <div>
                  <strong>{scenario.title}</strong>
                  {scenario.description && <p>{scenario.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </article>
      )}
      <button className="button primary" onClick={onLibrary} type="button">
        다른 사건 보기
      </button>
      {onWriteReview && (
        <button
          className="button secondary"
          onClick={onWriteReview}
          type="button"
        >
          리뷰 작성
        </button>
      )}
      <button className="button ghost" onClick={onHome} type="button">
        홈으로
      </button>
    </section>
  );
}

function ResultMatchRow({
  label,
  matched,
}: {
  label: string;
  matched: boolean;
}) {
  return (
    <div className={`result-match-row ${matched ? "matched" : ""}`}>
      <span>{label}</span>
      <strong>{matched ? "일치" : "확인 필요"}</strong>
    </div>
  );
}

function TimelineList({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return <StateBlock title="타임라인이 없습니다" />;
  return (
    <div className="timeline">
      {events.map((event, index) => (
        <article className="timeline-item" key={`${event.time}-${index}`}>
          <time>{event.time}</time>
          <div>
            <div className="card-title">{event.title}</div>
            {event.description && (
              <p className="card-body">{event.description}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Avatar({ suspect }: { suspect: Suspect }) {
  return (
    <div className="avatar">
      {suspect.portraitImageUrl ? (
        <img src={suspect.portraitImageUrl} alt={`${suspect.name} 프로필`} />
      ) : (
        <span>{initials(suspect.name)}</span>
      )}
    </div>
  );
}

function ScreenTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="screen-title">
      <h1>{title}</h1>
      <p className="eyebrow">{subtitle}</p>
    </div>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <article className="info-card">
      <p className="mini-title">{title}</p>
      <p className="card-body">{body}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-area">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function StateBlock({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: () => void;
}) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <div className="state-icon">CR</div>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action && (
        <button className="button secondary" onClick={action} type="button">
          다시 시도
        </button>
      )}
    </div>
  );
}

function ImageViewer({
  preview,
  onClose,
}: {
  preview: ImagePreview;
  onClose: () => void;
}) {
  return (
    <div className="image-viewer" role="dialog" aria-modal="true">
      <button
        className="image-viewer-backdrop"
        onClick={onClose}
        type="button"
        aria-label="닫기"
      />
      <div className="image-viewer-panel">
        <div className="image-viewer-topbar">
          <div>
            <p className="eyebrow">{preview.subtitle ?? "IMAGE"}</p>
            <h2>{preview.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            닫기
          </button>
        </div>
        <img src={preview.url} alt={preview.title} />
      </div>
    </div>
  );
}

export default App;
