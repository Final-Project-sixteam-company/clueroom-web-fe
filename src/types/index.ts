export type View =
  | "splash"
  | "onboarding"
  | "login"
  | "home"
  | "profile"
  | "records"
  | "library"
  | "bookmarks"
  | "scenarioDetail"
  | "briefing"
  | "case"
  | "evidenceDetail"
  | "suspectDetail"
  | "chat"
  | "submit"
  | "result";

export type Tokens = {
  accessToken: string;
  refreshToken?: string;
};

export type UserProfile = {
  userId?: number;
  email?: string;
  nickname: string;
  provider?: string;
  profileImageUrl?: string;
};

export type RecordItem = {
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

export type ImagePreview = {
  url: string;
  title: string;
  subtitle?: string;
};

export type ScenarioFilterState = {
  query: string;
  sort: "popular" | "latest" | "rating";
  type: "" | "OFFICIAL" | "CUSTOM";
  difficulty: "" | "EASY" | "NORMAL" | "HARD";
};

export type ScenarioPagePayload = {
  content?: Record<string, unknown>[];
  hasNext?: boolean;
  last?: boolean;
  page?: number;
  number?: number;
  totalPages?: number;
};

export type ScenarioReview = {
  reviewId: string;
  scenarioId: number;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
  isSpoiler: boolean;
};

export type ReviewDraftTarget = {
  scenarioId: number;
  title: string;
};

export type Scenario = {
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
  isBookmarked?: boolean;
};

export type Dashboard = {
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

export type CaseLocation = {
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

export type Hint = {
  hintId: number;
  hintLevel: number;
  isAvailable: boolean;
  isUsed: boolean;
  penaltyScore: number;
  content?: string;
  remainingMinutes?: number;
};

export type Evidence = {
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

export type Guidance = {
  readingPoints?: string[];
  compareEvidences?: {
    evidenceId?: number;
    title?: string;
    isUnlocked?: boolean;
    unlockHint?: string;
  }[];
  suggestedQuestions?: SuggestedQuestion[];
};

export type SuggestedQuestion = {
  targetSuspectId?: number;
  targetName?: string;
  question: string;
  presentedEvidenceId?: number;
  questionType?: string;
};

export type InterrogationLog = {
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

export type AiQuotaStatus = {
  scope?: string;
  scenarioUsed: number;
  scenarioLimit: number;
  accountUsed: number;
  accountLimit: number;
  stage?: string;
  recommendedAction?: string;
  message?: string;
  nextThreshold?: number | null;
  remaining: number;
};

export type Suspect = {
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

export type TimelineEvent = {
  time: string;
  title: string;
  description?: string;
  eventType?: string;
  relatedEvidenceId?: number;
};

export type ChatMessage = {
  sender: "detective" | "suspect";
  text: string;
  presentedEvidenceId?: number;
};

export type Result = {
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
