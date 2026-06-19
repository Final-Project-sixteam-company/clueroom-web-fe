import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Construction,
  Lock,
  MoreVertical,
  Play,
  SquarePen,
  TriangleAlert,
} from "lucide-react";
import { Button, Kicker, Pill, Spinner } from "../ui";
import type { PillTone } from "../ui";
import { AssetImage } from "../domain";
import { formatDifficulty } from "../../api/normalizers";
import type { ImagePreview, Scenario, ScenarioReview } from "../../types";
import styles from "./ScenarioDetailScreen.module.css";

// 픽셀 정본: lib/screens/scenario_detail_{screen,widgets,cards,rating}.dart
//   AppBar(arrow_back / bookmark / more_vert) → 16:9 히어로 → 본문(sp4 padding):
//     타입·난이도 배지 → titleL → 코드 monoLabel → 4셀 메타 그리드 →
//     시놉시스(Kicker) → 태그(Kicker, Wrap) → 평점·리뷰(Kicker + 평점카드 + 리뷰 + 작성)
//   bottomNavigationBar(ScenarioBottomCta): 준비중 경고 + [북마크 아이콘버튼][조사 시작/준비 중].
//
// 충실도 방침(koo #4): 픽셀=Flutter, 데이터/동작=웹 보존.
//   · 히어로: Flutter ScenarioHeroArt 는 이미지 없이 ink900→primary(25%) 그라디언트 + 코드 monoNum36.
//     웹은 thumbnailUrl 을 히어로로 노출(기존 동작) → 이미지 우선 + Flutter 그라디언트 폴백으로 화합.
//     (도메인 ScenarioCoverImage 는 그라디언트가 ink900→teal 로 상세 정본과 달라 여기서 재사용 안 함.)
//   · canPlay: 웹은 canPlay===false 만 불가(undefined=가능) → 그 동작 보존. Flutter 텍스트 "조사 시작"은
//     앱 전반의 어휘("수사")와 맞춰 "수사 시작"으로 둠(나머지 픽셀/레이아웃은 Flutter 그대로).
//   · 리뷰 작성 = onWriteReview 콜백(App 의 ReviewDialog). Flutter ReviewWriteSheet(바텀시트)는 game_modals 패스 몫.
//   · 평점 분포 막대는 Flutter 도 하드코딩(_ratios)인 장식 요소 → 동일 비율로 픽셀만 재현.
//   · Flutter 에 있는 subtitle / 웹에만 있는 author(제작자) 패널은 정본 레이아웃에 없어 미표시(데이터는 보존).

// 난이도 → Pill tone (Flutter: easy→success / medium→primary / hard→danger). LibraryScreen 과 동일 매핑.
const DIFFICULTY_TONE: Record<string, PillTone> = {
  EASY: "success",
  HARD: "danger",
};

// Flutter ScenarioRatingCard._ratios — 분포 막대(장식, Flutter 도 하드코딩). 별 5→1 순.
const RATING_RATIOS = [0.68, 0.22, 0.07, 0.02, 0.01] as const;

// 웹 Scenario 엔 code 가 없어 상세/브리핑과 동일하게 합성(CL-NNN).
function scenarioCode(scenarioId: number) {
  return `CL-${String(scenarioId).padStart(3, "0")}`;
}

// Flutter ScenarioRatingCard._fmt 와 동일: 1000 이상은 'x.xk'.
function formatPlays(plays: number) {
  return plays >= 1000 ? `${(plays / 1000).toFixed(1)}k` : String(plays);
}

// Flutter ScenarioReviewCard: '${createdAt.month}.${createdAt.day}'. 웹 createdAt 은 ISO 문자열.
function formatReviewDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

export interface ScenarioDetailScreenProps {
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
}

export function ScenarioDetailScreen({
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
}: ScenarioDetailScreenProps) {
  const s = scenario;
  const code = scenarioCode(s.scenarioId);
  // 웹 동작 보존: canPlay===false 만 불가, undefined/true 는 가능.
  const isPlayable = s.canPlay !== false;
  const difficultyTone = DIFFICULTY_TONE[s.difficulty] ?? "primary";
  const isOfficial = s.scenarioType === "OFFICIAL";
  const tags = s.tags ?? [];
  const synopsis = s.synopsis || s.description || "사건 설명이 없습니다.";
  const hasThumb = !!s.thumbnailUrl;

  const heroFallback = (
    <span className={styles.heroGradient} aria-hidden>
      <span className={styles.heroCode}>{code}</span>
    </span>
  );

  return (
    <section className={styles.screen}>
      {/* AppBar — Flutter 투명 AppBar(arrow_back / bookmark / more_vert) */}
      <header className={styles.bar}>
        <button
          type="button"
          className={`${styles.barBtn} ${styles.barBack}`}
          onClick={onBack}
          aria-label="뒤로"
        >
          <ArrowLeft size={24} strokeWidth={2} aria-hidden />
        </button>
        <span className={styles.barSpacer} />
        <button
          type="button"
          className={`${styles.barBtn} ${bookmarked ? styles.barBtnActive : ""}`}
          onClick={onToggleBookmark}
          aria-label={bookmarked ? "저장 해제" : "저장"}
          aria-pressed={bookmarked}
        >
          <Bookmark
            size={24}
            strokeWidth={2}
            fill={bookmarked ? "currentColor" : "none"}
            aria-hidden
          />
        </button>
        {/* Flutter more_vert: onPressed(){} 무동작 placeholder. 픽셀 충실 위해 비활성으로 표시. */}
        <span className={styles.barBtnGhost} aria-hidden>
          <MoreVertical size={24} strokeWidth={2} />
        </span>
      </header>

      <div className={styles.scroll}>
        {hasThumb ? (
          <button
            type="button"
            className={styles.hero}
            aria-label={`${s.title} 이미지 크게 보기`}
            onClick={() =>
              onOpenImage({
                url: s.thumbnailUrl as string,
                title: s.title,
                subtitle: "시나리오 이미지",
              })
            }
          >
            <AssetImage
              src={s.thumbnailUrl}
              alt={`${s.title} 대표 이미지`}
              width="100%"
              height="100%"
              fit="cover"
              fallback={heroFallback}
            />
          </button>
        ) : (
          <div className={styles.hero}>{heroFallback}</div>
        )}

        <div className={styles.body}>
          {error ? <p className={styles.error}>{error}</p> : null}

          {loading ? (
            <div className={styles.loading}>
              <Spinner size={28} />
            </div>
          ) : (
            <>
              <div className={styles.badges}>
                {isOfficial ? <Pill label="공식" tone="danger" /> : null}
                <Pill label={formatDifficulty(s.difficulty)} tone={difficultyTone} />
              </div>

              <h1 className={styles.title}>{s.title}</h1>
              <p className={styles.code}>{code}</p>

              <ScenarioMetaGrid scenario={s} />

              <section className={styles.section}>
                <Kicker label="시놉시스 · SYNOPSIS" className={styles.sectionKicker} />
                <p className={styles.synopsis}>{synopsis}</p>
              </section>

              {tags.length > 0 ? (
                <section className={styles.section}>
                  <Kicker label="태그" className={styles.sectionKicker} />
                  <div className={styles.tags}>
                    {tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className={styles.section}>
                <Kicker label="평점 · REVIEWS" className={styles.sectionKicker} />
                <ScenarioRatingCard scenario={s} />
                {reviews.map((review) => (
                  <ReviewCard key={review.reviewId} review={review} />
                ))}
                <Button
                  label="리뷰 작성하기"
                  variant="secondary"
                  expanded
                  icon={SquarePen}
                  onPress={onWriteReview}
                />
              </section>
            </>
          )}
        </div>
      </div>

      {/* 하단 CTA — Flutter ScenarioBottomCta(SafeArea) */}
      <footer className={styles.cta}>
        {!isPlayable ? (
          <div className={styles.notice}>
            <Construction
              size={16}
              strokeWidth={2}
              aria-hidden
              className={styles.noticeIcon}
            />
            <span className={styles.noticeText}>
              {code} 시나리오는 아직 준비 중입니다.
            </span>
          </div>
        ) : null}
        <div className={styles.ctaRow}>
          <Button
            variant={bookmarked ? "primary" : "secondary"}
            icon={Bookmark}
            ariaLabel={bookmarked ? "저장 해제" : "저장"}
            onPress={onToggleBookmark}
          />
          <div className={styles.ctaPlay}>
            <Button
              label={isPlayable ? "수사 시작" : "준비 중"}
              variant="primary"
              expanded
              icon={isPlayable ? Play : Lock}
              onPress={isPlayable ? onStart : undefined}
            />
          </div>
        </div>
      </footer>
    </section>
  );
}

// ── 메타 그리드 (ScenarioMetaGrid) — 4셀 1행, 셀 사이 세로 구분선 ────────────────
function ScenarioMetaGrid({ scenario }: { scenario: Scenario }) {
  const cells: ReadonlyArray<readonly [string, string]> = [
    ["난이도", formatDifficulty(scenario.difficulty)],
    ["플레이시간", `${scenario.estimatedPlayTimeMinutes}분`],
    ["용의자", scenario.suspectCount > 0 ? `${scenario.suspectCount}명` : "—"],
    ["증거", scenario.evidenceCount > 0 ? `${scenario.evidenceCount}개` : "—"],
  ];
  return (
    <div className={styles.metaGrid}>
      {cells.map(([label, value]) => (
        <div key={label} className={styles.metaCell}>
          <span className={styles.metaLabel}>{label}</span>
          <span className={styles.metaValue}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── 평점 카드 (ScenarioRatingCard) — 점수 + 분포 막대 5행 ────────────────────────
function ScenarioRatingCard({ scenario }: { scenario: Scenario }) {
  return (
    <div className={styles.ratingCard}>
      <div className={styles.ratingScore}>
        <span className={styles.ratingNum}>{scenario.averageRating.toFixed(1)}</span>
        <span className={styles.ratingPlays}>
          {formatPlays(scenario.playCount)}플레이
        </span>
      </div>
      <div className={styles.ratingBars}>
        {RATING_RATIOS.map((ratio, index) => {
          const star = 5 - index;
          return (
            <div key={star} className={styles.ratingBarRow}>
              <span className={styles.ratingStar}>{star}</span>
              <span className={styles.ratingTrack}>
                <span
                  className={styles.ratingFill}
                  style={{ width: `${ratio * 100}%` }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 리뷰 카드 (ScenarioReviewCard) — 스포일러 탭하면 공개 ────────────────────────
function ReviewCard({ review }: { review: ScenarioReview }) {
  const [revealed, setRevealed] = useState(false);
  const hidden = review.isSpoiler && !revealed;
  return (
    <article className={styles.reviewCard}>
      <div className={styles.reviewHead}>
        <span className={styles.reviewAuthor}>{review.authorName}</span>
        <span className={styles.reviewRating}>★ {review.rating.toFixed(1)}</span>
        <span className={styles.reviewDate}>{formatReviewDate(review.createdAt)}</span>
      </div>
      {hidden ? (
        <button
          type="button"
          className={styles.spoiler}
          onClick={() => setRevealed(true)}
        >
          <TriangleAlert
            size={16}
            strokeWidth={2}
            aria-hidden
            className={styles.spoilerIcon}
          />
          <span>스포일러 포함 — 탭하면 공개</span>
        </button>
      ) : (
        <p className={styles.reviewBody}>{review.body}</p>
      )}
    </article>
  );
}
