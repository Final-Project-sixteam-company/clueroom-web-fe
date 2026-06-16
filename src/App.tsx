import {
  appLogin,
  getAnonymousKey,
  Storage,
} from "@apps-in-toss/web-framework";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://api.clueroom.xyz";
const TOSS_AUTH_PATH = import.meta.env.VITE_TOSS_AUTH_PATH ?? "/api/auth/toss";
const ENABLE_DEV_LOGIN =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === "true";

const ACCESS_KEY = "clueroom.accessToken";
const REFRESH_KEY = "clueroom.refreshToken";
const DEVICE_KEY = "clueroom.deviceId";

type View =
  | "login"
  | "home"
  | "library"
  | "scenarioDetail"
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
    return await Storage.getItem(key);
  } catch {
    return localStorage.getItem(key);
  }
}

async function safeSet(key: string, value: string) {
  try {
    await Storage.setItem(key, value);
  } catch {
    localStorage.setItem(key, value);
  }
}

async function safeRemove(key: string) {
  try {
    await Storage.removeItem(key);
  } catch {
    localStorage.removeItem(key);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDeviceId() {
  const stored = await safeGet(DEVICE_KEY);
  if (stored) return stored;

  try {
    const anonymous = await getAnonymousKey();
    if (anonymous && anonymous !== "ERROR" && anonymous.hash) {
      await safeSet(DEVICE_KEY, anonymous.hash);
      return anonymous.hash;
    }
  } catch {
    // 브라우저 단독 실행에서는 토스 브릿지가 없을 수 있다.
  }

  const generated =
    globalThis.crypto?.randomUUID?.() ??
    `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await safeSet(DEVICE_KEY, generated);
  return generated;
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
    thumbnailUrl:
      typeof raw.thumbnailUrl === "string" ? raw.thumbnailUrl : undefined,
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
  const imageUrl =
    typeof raw.imageUrl === "string" && raw.imageUrl.trim()
      ? raw.imageUrl.trim()
      : undefined;
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
      typeof raw.locationName === "string" ? raw.locationName : undefined,
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
    const imageUrl =
      typeof row.imageUrl === "string" && row.imageUrl.trim()
        ? row.imageUrl.trim()
        : undefined;
    return {
      locationId: Number(row.locationId ?? row.id ?? 0),
      name: String(row.name ?? "장소"),
      floor: typeof row.floor === "string" ? row.floor : undefined,
      description:
        typeof row.description === "string" ? row.description : undefined,
      imageUrl,
      totalEvidenceCount: Number(row.totalEvidenceCount ?? 0),
      unlockedEvidenceCount: Number(row.unlockedEvidenceCount ?? 0),
    };
  });
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
  const portrait =
    typeof raw.portraitImageUrl === "string" && raw.portraitImageUrl.trim()
      ? raw.portraitImageUrl.trim()
      : undefined;

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

function App() {
  const [view, setView] = useState<View>("home");
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
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
  }, [authReady]);

  async function persistTokens(next: Tokens) {
    await safeSet(ACCESS_KEY, next.accessToken);
    if (next.refreshToken) await safeSet(REFRESH_KEY, next.refreshToken);
    setTokens(next);
  }

  async function logout() {
    await safeRemove(ACCESS_KEY);
    await safeRemove(REFRESH_KEY);
    setTokens(null);
    setSessionId(null);
    setDashboard(null);
    setView("login");
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

  async function handleTossLogin() {
    setAuthError(null);
    try {
      const { authorizationCode, referrer } = await appLogin();
      const deviceId = await getDeviceId();
      const data = await request<Tokens>(TOSS_AUTH_PATH, {
        method: "POST",
        body: JSON.stringify({ authorizationCode, referrer, deviceId }),
      });
      await persistTokens(data);
      setView("home");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "토스 로그인 연동에 실패했습니다.",
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

  async function loadScenarios() {
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      const data = await request<
        { content?: Record<string, unknown>[] } | Record<string, unknown>[]
      >("/api/scenarios", {
        query: { sort: "popular", page: 0, size: 20 },
      });
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

  async function openScenarioDetail(scenario: Scenario) {
    setSelectedScenario(scenario);
    setScenarioDetailError(null);
    setView("scenarioDetail");
    setScenarioDetailLoading(true);
    try {
      const detail = await request<Record<string, unknown>>(
        `/api/scenarios/${scenario.scenarioId}`,
      );
      setSelectedScenario(normalizeScenario(detail));
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
      await loadCase(nextSessionId);
    } catch (error) {
      setCaseError(
        error instanceof Error ? error.message : "세션을 시작하지 못했습니다.",
      );
    } finally {
      setCaseLoading(false);
    }
  }

  async function loadCase(id = sessionId) {
    if (!id || !authToken) return;
    setCaseLoading(true);
    setCaseError(null);
    try {
      const [
        nextDashboard,
        evidenceData,
        suspectData,
        timelineData,
        locationData,
        hintData,
      ] = await Promise.all([
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
        authedRequest<TimelineEvent[]>(`/api/play-sessions/${id}/timeline`),
        authedRequest<unknown>(`/api/play-sessions/${id}/locations`),
        authedRequest<Record<string, unknown>[]>(
          `/api/play-sessions/${id}/hints`,
        ),
      ]);

      setDashboard(nextDashboard);
      setEvidences(evidenceData.map(normalizeEvidence));
      setSuspects(suspectData.map(normalizeSuspect));
      setTimeline(timelineData);
      setLocations(normalizeLocations(locationData));
      setHints(hintData.map(normalizeHint));
    } catch (error) {
      setCaseError(
        error instanceof Error
          ? error.message
          : "수사 정보를 불러오지 못했습니다.",
      );
    } finally {
      setCaseLoading(false);
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
      const logs = await authedRequest<InterrogationLog[]>(
        `/api/play-sessions/${sessionId}/interrogations`,
        {
          query: { suspectId: suspect.suspectId },
        },
      );
      setSuspectLogs(logs);
    } catch {
      setSuspectLogs([]);
    } finally {
      setSuspectDetailLoading(false);
    }
  }

  async function openChat(suspect: Suspect, prefill?: SuggestedQuestion) {
    setChatSuspect(suspect);
    setMessages([
      {
        sender: "suspect",
        text: suspect.publicStatement?.trim() || "무엇이 궁금하신가요?",
      },
    ]);
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
        return await authedRequest<Result>(`/api/play-sessions/${id}/result`);
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
      const submitted = await authedRequest<Result>(
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
      );
      setResult(submitted);
      try {
        const finalResult = await pollResult(sessionId);
        setResult(finalResult);
      } catch {
        // 제출 응답만으로도 결과 화면을 구성할 수 있다.
      }
      setView("result");
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.code === "AI010" || error.status === 409)
      ) {
        const finalResult = await pollResult(sessionId);
        setResult(finalResult);
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
      onLogout={tokens ? logout : undefined}
    >
      {view === "login" && (
        <LoginScreen
          error={authError}
          onTossLogin={handleTossLogin}
          onDevLogin={handleDevLogin}
        />
      )}

      {view === "home" && (
        <HomeScreen
          isLoggedIn={!!tokens}
          scenarioCount={scenarios.length}
          onLogin={() => setView("login")}
          onBrowse={() => setView("library")}
          onResume={() => {
            if (sessionId) setView("case");
          }}
          hasSession={!!sessionId}
        />
      )}

      {view === "library" && (
        <LibraryScreen
          scenarios={scenarios}
          loading={scenarioLoading}
          error={scenarioError}
          onRefresh={loadScenarios}
          onSelect={openScenarioDetail}
        />
      )}

      {view === "scenarioDetail" && selectedScenario && (
        <ScenarioDetailScreen
          scenario={selectedScenario}
          loading={scenarioDetailLoading}
          error={scenarioDetailError}
          onBack={() => setView("library")}
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
          hints={hints}
          loading={caseLoading}
          error={caseError}
          onRetry={() => loadCase()}
          onEvidenceDetail={openEvidenceDetail}
          onSuspectDetail={openSuspectDetail}
          onUseHint={useHint}
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
  onLogout,
}: {
  children: React.ReactNode;
  title: string;
  onHome?: () => void;
  onLibrary?: () => void;
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
  onTossLogin,
  onDevLogin,
}: {
  error: string | null;
  onTossLogin: () => void;
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
        토스 안에서 단서를 모으고, 인물을 심문하고, 마지막 추리를 제출하세요.
      </p>
      <button className="button primary" onClick={onTossLogin} type="button">
        토스로 시작하기
      </button>
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

function HomeScreen({
  isLoggedIn,
  scenarioCount,
  hasSession,
  onLogin,
  onBrowse,
  onResume,
}: {
  isLoggedIn: boolean;
  scenarioCount: number;
  hasSession: boolean;
  onLogin: () => void;
  onBrowse: () => void;
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
      {hasSession && (
        <button className="button secondary" onClick={onResume} type="button">
          진행 중인 수사로 돌아가기
        </button>
      )}
    </section>
  );
}

function LibraryScreen({
  scenarios,
  loading,
  error,
  onRefresh,
  onSelect,
}: {
  scenarios: Scenario[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelect: (scenario: Scenario) => void;
}) {
  return (
    <section className="stack">
      <ScreenTitle title="시나리오 라이브러리" subtitle="MYSTERY LIBRARY" />
      <div className="chip-row">
        {["전체", "공식", "인기", "최신", "보통"].map((label, index) => (
          <span className={`chip ${index === 0 ? "active" : ""}`} key={label}>
            {label}
          </span>
        ))}
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
                <img src={scenario.thumbnailUrl} alt="" />
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

function ScenarioDetailScreen({
  scenario,
  loading,
  error,
  onBack,
  onStart,
}: {
  scenario: Scenario;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <section className="stack">
      <button className="icon-button fit" onClick={onBack} type="button">
        라이브러리로 돌아가기
      </button>
      <div className="scenario-hero">
        {scenario.thumbnailUrl ? (
          <img src={scenario.thumbnailUrl} alt="" />
        ) : (
          <span>CL-{String(scenario.scenarioId).padStart(3, "0")}</span>
        )}
      </div>
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
        <Stat label="평점" value={scenario.averageRating.toFixed(1)} />
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

function CaseScreen({
  caseTab,
  setCaseTab,
  dashboard,
  evidences,
  suspects,
  timeline,
  locations,
  hints,
  loading,
  error,
  onRetry,
  onEvidenceDetail,
  onSuspectDetail,
  onUseHint,
  onSubmit,
}: {
  caseTab: "scene" | "evidence" | "suspects" | "timeline";
  setCaseTab: (tab: "scene" | "evidence" | "suspects" | "timeline") => void;
  dashboard: Dashboard | null;
  evidences: Evidence[];
  suspects: Suspect[];
  timeline: TimelineEvent[];
  locations: CaseLocation[];
  hints: Hint[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEvidenceDetail: (evidence: Evidence) => void;
  onSuspectDetail: (suspect: Suspect) => void;
  onUseHint: (hint: Hint) => void;
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
          <LocationPanel locations={locations} />
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

function LocationPanel({ locations }: { locations: CaseLocation[] }) {
  if (!locations.length) return null;

  return (
    <article className="info-card">
      <p className="mini-title">현장 보드</p>
      <div className="location-grid">
        {locations.map((location) => (
          <div className="location-card" key={location.locationId}>
            {location.imageUrl ? (
              <img src={location.imageUrl} alt="" />
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
          </div>
        ))}
      </div>
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
  return (
    <div className="card-list">
      {evidences.map((evidence) => (
        <button
          className={`info-card evidence-card ${evidence.isUnlocked ? "" : "locked"}`}
          key={evidence.evidenceId}
          onClick={() => onEvidenceDetail(evidence)}
          type="button"
        >
          <div className="row">
            <div className="evidence-thumb">
              {evidence.imageUrl ? (
                <img src={evidence.imageUrl} alt="" />
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
  onCompareEvidence,
  onChat,
}: {
  evidence: Evidence;
  suspects: Suspect[];
  evidences: Evidence[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
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
      <div className="evidence-hero">
        {evidence.imageUrl ? (
          <img src={evidence.imageUrl} alt="" />
        ) : (
          <span>{evidence.isUnlocked ? "EV" : "LOCKED"}</span>
        )}
      </div>
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
  return (
    <div className="card-list">
      {suspects.map((suspect) => (
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
              {suspect.relationToVictim ? ` · ${suspect.relationToVictim}` : ""}
            </p>
            <div className="meta-row">
              <span>{suspect.isWitness ? "증인" : "용의자"}</span>
              <span>심문 {suspect.interrogationCount ?? 0}회</span>
            </div>
          </div>
        </button>
      ))}
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
      <select
        className="select"
        onChange={(e) => {
          if (e.target.value) onAttachEvidence(Number(e.target.value));
        }}
        value={pendingEvidence?.evidenceId ?? ""}
      >
        <option value="">증거 선택 안 함</option>
        {evidences.map((evidence) => (
          <option key={evidence.evidenceId} value={evidence.evidenceId}>
            {evidence.title}
          </option>
        ))}
      </select>
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
    </section>
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
      <label className="field-label">제출 증거</label>
      <div className="evidence-picker">
        {evidences.map((evidence) => {
          const active = selectedEvidenceIds.includes(evidence.evidenceId);
          return (
            <button
              className={`chip ${active ? "active" : ""}`}
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
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        type="button"
      >
        {submitting ? "제출 중" : "최종 추리 제출"}
      </button>
    </section>
  );
}

function ResultScreen({
  result,
  onHome,
  onLibrary,
}: {
  result: Result | null;
  onHome: () => void;
  onLibrary: () => void;
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
      <div className="stats-grid">
        <Stat label="범인" value={result.matched?.culprit ? "일치" : "확인"} />
        <Stat label="동기" value={result.matched?.motive ? "일치" : "확인"} />
        <Stat label="증거" value={`${result.matched?.keyEvidences ?? 0}개`} />
      </div>
      <button className="button primary" onClick={onLibrary} type="button">
        다른 사건 보기
      </button>
      <button className="button ghost" onClick={onHome} type="button">
        홈으로
      </button>
    </section>
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
        <img src={suspect.portraitImageUrl} alt="" />
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
    <div className="state-block">
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

export default App;
