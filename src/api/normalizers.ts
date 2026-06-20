import { SCENARIO_PAGE_SIZE } from "../config/env";
import { firstPublicImageUrl } from "./request";
import type {
  UserProfile,
  RecordItem,
  ScenarioFilterState,
  ScenarioPagePayload,
  ScenarioReview,
  Scenario,
  CaseLocation,
  Hint,
  Evidence,
  Guidance,
  InterrogationLog,
  Suspect,
  TimelineEvent,
  ChatMessage,
  Result,
} from "../types";

export function normalizeScenario(raw: Record<string, unknown>): Scenario {
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
    isBookmarked:
      typeof raw.isBookmarked === "boolean" ? raw.isBookmarked : undefined,
  };
}

export function buildScenarioQuery(filter: ScenarioFilterState, page: number) {
  const query: Record<string, string | number> = {
    sort: filter.sort,
    page,
    size: SCENARIO_PAGE_SIZE,
  };
  if (filter.query.trim()) query.keyword = filter.query.trim();
  if (filter.type) query.type = filter.type;
  if (filter.difficulty) query.difficulty = filter.difficulty;
  return query;
}

export function normalizeScenarioPage(
  data: ScenarioPagePayload | Record<string, unknown>[],
  requestedPage: number,
) {
  const list = Array.isArray(data) ? data : (data.content ?? []);
  const scenarios = list.map(normalizeScenario);
  const page =
    !Array.isArray(data) && typeof data.number === "number"
      ? data.number
      : !Array.isArray(data) && typeof data.page === "number"
        ? data.page
        : requestedPage;
  const hasNext = Array.isArray(data)
    ? false
    : typeof data.hasNext === "boolean"
      ? data.hasNext
      : typeof data.last === "boolean"
        ? !data.last
        : typeof data.totalPages === "number"
          ? page + 1 < data.totalPages
          : scenarios.length >= SCENARIO_PAGE_SIZE;
  return { scenarios, page, hasNext };
}

export function normalizeGuidance(raw: unknown): Guidance | undefined {
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

export function normalizeEvidence(raw: Record<string, unknown>): Evidence {
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

export function normalizeTimelineEvent(raw: Record<string, unknown>): TimelineEvent {
  return {
    time: String(raw.time ?? raw.eventTime ?? raw.occurredAt ?? ""),
    title: String(raw.title ?? raw.name ?? "타임라인"),
    description:
      typeof raw.description === "string"
        ? raw.description
        : typeof raw.detail === "string"
          ? raw.detail
          : undefined,
    eventType:
      typeof raw.eventType === "string"
        ? raw.eventType
        : typeof raw.type === "string"
          ? raw.type
          : undefined,
    relatedEvidenceId:
      typeof raw.relatedEvidenceId === "number"
        ? raw.relatedEvidenceId
        : raw.relatedEvidenceId
          ? Number(raw.relatedEvidenceId)
          : undefined,
  };
}

export function normalizeLocations(raw: unknown): CaseLocation[] {
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

export function normalizeLocationPayload(raw: unknown) {
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

export function normalizeHint(raw: Record<string, unknown>): Hint {
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

export function normalizeSuspect(raw: Record<string, unknown>): Suspect {
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

export function normalizeInterrogationLog(raw: Record<string, unknown>): InterrogationLog {
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

export function messagesFromLogs(logs: InterrogationLog[], fallback: string) {
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

export function normalizeUserProfile(raw: unknown): UserProfile {
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

export function normalizeRecord(raw: unknown): RecordItem | null {
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

export function normalizeReview(raw: unknown, fallbackScenarioId = 0): ScenarioReview | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const user =
    data.user && typeof data.user === "object"
      ? (data.user as Record<string, unknown>)
      : null;
  const scenarioId = Number(data.scenarioId ?? fallbackScenarioId);
  const body = String(data.body ?? data.content ?? "").trim();
  const createdAt = String(data.createdAt ?? "").trim();
  if (!scenarioId || !body || !createdAt) return null;

  return {
    reviewId: String(data.reviewId ?? data.id ?? `review-${createdAt}`),
    scenarioId,
    authorName:
      typeof data.authorName === "string" && data.authorName.trim()
        ? data.authorName.trim()
        : typeof user?.nickname === "string" && user.nickname.trim()
          ? user.nickname.trim()
        : "나",
    rating: Math.max(1, Math.min(5, Math.round(Number(data.rating ?? 5)))),
    body,
    createdAt,
    isSpoiler: data.isSpoiler === true,
  };
}

export function normalizeResult(raw: unknown): Result {
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
        .filter((item): item is NonNullable<typeof item> => !!item)
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
        .filter((item): item is NonNullable<typeof item> => !!item)
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

export function sessionIdFallback(data: Record<string, unknown>) {
  return data.playSessionId ?? data.id;
}

export function formatDifficulty(value: string) {
  if (value === "EASY") return "쉬움";
  if (value === "HARD") return "어려움";
  return "보통";
}

export function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "CR";
}

export function formatDateTime(value?: string) {
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
