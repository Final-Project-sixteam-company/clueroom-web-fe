// 정본: lib/screens/evidence_detail_screen.dart (+ evidence_detail_{widgets,meta}.dart, GAMEPLAY_SPEC §6~7)
//   bare AppBar('EVIDENCE') + 히어로(86) + 제목/위치(중앙) + 상태 Pill + 관찰 정보 카드(설명/관련 용의자·
//   타임라인/가이던스: 볼 점·함께 볼 증거·추천 질문). 정본 차이는 ⚠ 표기.
// 웹 보존(koo #4): prop 계약 = 기존 인라인 EvidenceDetailScreen 동일 → App.tsx 호출부 무변경(태그명만 교체).
//   웹은 정본보다 인터랙션이 많음(관련 용의자/추천 질문 chip → onChat, fallbackGuidance 합성, '증거 제시'
//   용의자 섹션). 전부 보존하되 Flutter 픽셀로 렌더. 정본 CTA(onInterrogate/onPresent)는 웹 계약에 없어 생략.
import { ArrowLeft, Search, Lock, HelpCircle, ChevronRight } from "lucide-react";
import type { Suspect, Evidence, Guidance, SuggestedQuestion, ImagePreview } from "../../types";
import { Pill, Kicker, Spinner } from "../ui";
import { AssetImage, evidenceCategoryIcon } from "../domain";
import styles from "./EvidenceDetailScreen.module.css";

export interface EvidenceDetailScreenProps {
  evidence: Evidence;
  suspects: Suspect[];
  evidences: Evidence[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onOpenImage: (preview: ImagePreview) => void;
  onCompareEvidence: (evidenceId: number) => void;
  onChat: (suspect: Suspect, prefill?: SuggestedQuestion) => void;
}

export function EvidenceDetailScreen({
  evidence,
  suspects,
  evidences,
  loading,
  error,
  onBack,
  onOpenImage,
  onCompareEvidence,
  onChat,
}: EvidenceDetailScreenProps) {
  const effectiveLocked = !evidence.isUnlocked;
  const titleText = evidence.isUnlocked ? evidence.title : "잠긴 증거";
  const statusLabel = evidence.isUnlocked ? "확보됨" : "잠김";
  const HeroIcon = evidenceCategoryIcon(evidence.category);

  // 관찰 본문(웹 텍스트 보존).
  const observationBody = effectiveLocked
    ? evidence.unlockHint || "수사를 진행하면 확인할 수 있습니다."
    : evidence.description || evidence.oneLine || "아직 공개된 설명이 없습니다.";
  const observationLoading = loading && !effectiveLocked && !evidence.description;

  // 관련 용의자(웹: evidence.relatedSuspects → 전체 Suspect 매핑).
  const relatedSuspects = (evidence.relatedSuspects ?? [])
    .map((r) => suspects.find((s) => s.suspectId === r.suspectId))
    .filter((s): s is Suspect => !!s);

  // fallbackGuidance(웹: 해금됐고 guidance 없으면 합성).
  const fallbackTargets = relatedSuspects.length
    ? relatedSuspects
    : suspects.filter((s) => !s.isWitness).slice(0, 3);
  const fallbackGuidance: Guidance | undefined =
    evidence.isUnlocked && !evidence.guidance
      ? {
          readingPoints: [
            evidence.oneLine ||
              "증거의 시간, 장소, 관련 인물 진술이 서로 맞는지 비교하세요.",
          ],
          suggestedQuestions: fallbackTargets.slice(0, 3).map((s) => ({
            targetSuspectId: s.suspectId,
            targetName: s.name,
            question: `${evidence.title}에 대해 알고 있는 것을 말해 주세요.`,
            presentedEvidenceId: evidence.evidenceId,
            questionType: "EVIDENCE_PRESENTED",
          })),
        }
      : undefined;
  const guidance = evidence.guidance ?? fallbackGuidance;

  // 증거 연동 prefill 질문(웹).
  const presentPrefill = (s: Suspect, q: string): SuggestedQuestion => ({
    targetSuspectId: s.suspectId,
    question: q,
    presentedEvidenceId: evidence.evidenceId,
    questionType: "EVIDENCE_PRESENTED",
  });

  const presentSuspects = suspects.filter((s) => !s.isWitness).slice(0, 6);

  return (
    <section className={styles.screen}>
      <header className={styles.bar}>
        <button className={styles.backBtn} onClick={onBack} aria-label="뒤로" type="button">
          <ArrowLeft size={20} strokeWidth={2} aria-hidden />
        </button>
        <span className={styles.barTitle}>EVIDENCE</span>
      </header>

      <div className={styles.scroll}>
        {/* 히어로(86, 탭→이미지 뷰어) */}
        <div className={styles.heroWrap}>
          {evidence.imageUrl ? (
            <button
              className={styles.hero}
              onClick={() =>
                onOpenImage({
                  url: evidence.imageUrl!,
                  title: titleText,
                  subtitle: evidence.locationName ?? "증거 이미지",
                })
              }
              aria-label={`${titleText} 이미지 크게 보기`}
              type="button"
            >
              <AssetImage
                src={evidence.imageUrl}
                alt={titleText}
                width="100%"
                height="100%"
                fit="cover"
                fallback={<HeroIcon size={34} strokeWidth={2} className={styles.heroIcon} aria-hidden />}
              />
            </button>
          ) : (
            <div className={styles.hero}>
              <HeroIcon size={34} strokeWidth={2} className={styles.heroIcon} aria-hidden />
            </div>
          )}
        </div>

        <h1 className={styles.title}>{titleText}</h1>
        <p className={styles.location}>
          {effectiveLocked ? "해금 후 위치 정보가 공개됩니다" : evidence.locationName ?? "위치 미상"}
        </p>

        <div className={styles.statusRow}>
          <Pill label={statusLabel} tone={evidence.isUnlocked ? "success" : "mute"} />
        </div>

        {/* 관찰 정보 카드 */}
        <article className={styles.card}>
          <Kicker label="관찰 정보" className={styles.kicker} />
          {observationLoading ? (
            <div className={styles.loadingRow}>
              <Spinner size={14} />
              <span className={styles.loadingText}>상세 정보를 불러오는 중…</span>
            </div>
          ) : (
            <p className={styles.body}>{observationBody}</p>
          )}

          {!effectiveLocked && relatedSuspects.length > 0 ? (
            <>
              <Kicker label="관련 용의자" className={styles.subKicker} />
              <div className={styles.pills}>
                {relatedSuspects.map((s) => (
                  <button
                    key={s.suspectId}
                    className={styles.pillBtn}
                    onClick={() =>
                      onChat(
                        s,
                        presentPrefill(
                          s,
                          `${evidence.title}에 대해 알고 있는 것을 말해 주세요.`,
                        ),
                      )
                    }
                    type="button"
                  >
                    <Pill label={s.name} tone="primary" />
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {!effectiveLocked && evidence.relatedTimelineEvents?.length ? (
            <>
              <Kicker label="관련 타임라인" className={styles.subKicker} />
              <div className={styles.timeline}>
                {evidence.relatedTimelineEvents.map((e, i) => (
                  <div className={styles.timelineRow} key={i}>
                    <span className={styles.timelineTime}>{e.time}</span>
                    <span className={styles.timelineTitle}>{e.title}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {!effectiveLocked && guidance ? (
            <>
              {guidance.readingPoints?.length ? (
                <>
                  <Kicker label="이 증거에서 볼 점" className={styles.subKicker} />
                  <ul className={styles.bullets}>
                    {guidance.readingPoints.map((point) => (
                      <li className={styles.bullet} key={point}>
                        {point}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {guidance.compareEvidences?.length ? (
                <>
                  <Kicker label="함께 볼 증거" className={styles.subKicker} />
                  <div className={styles.rows}>
                    {guidance.compareEvidences.map((ce, i) => {
                      const tappable = ce.isUnlocked && ce.evidenceId != null;
                      const Inner = (
                        <>
                          {ce.isUnlocked ? (
                            <Search size={16} strokeWidth={2} className={styles.rowIcon} aria-hidden />
                          ) : (
                            <Lock size={16} strokeWidth={2} className={styles.rowIcon} aria-hidden />
                          )}
                          <span className={styles.rowBody}>
                            <span className={ce.isUnlocked ? styles.rowTitle : styles.rowTitleMuted}>
                              {ce.isUnlocked ? ce.title || "증거" : "잠긴 증거"}
                            </span>
                            {!ce.isUnlocked && ce.unlockHint ? (
                              <span className={styles.rowHint}>해금 힌트: {ce.unlockHint}</span>
                            ) : null}
                          </span>
                          {tappable ? (
                            <ChevronRight size={16} strokeWidth={2} className={styles.rowIcon} aria-hidden />
                          ) : null}
                        </>
                      );
                      return tappable ? (
                        <button
                          key={ce.evidenceId ?? i}
                          className={styles.row}
                          onClick={() => onCompareEvidence(ce.evidenceId!)}
                          type="button"
                        >
                          {Inner}
                        </button>
                      ) : (
                        <div key={ce.evidenceId ?? i} className={styles.rowStatic}>
                          {Inner}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {guidance.suggestedQuestions?.length ? (
                <>
                  <Kicker label="추천 질문" className={styles.subKicker} />
                  <div className={styles.rows}>
                    {guidance.suggestedQuestions.map((q, i) => {
                      const target = suspects.find((s) => s.suspectId === q.targetSuspectId);
                      if (!target) return null;
                      return (
                        <button
                          key={`${q.targetSuspectId}-${i}`}
                          className={styles.row}
                          onClick={() => onChat(target, q)}
                          type="button"
                        >
                          <HelpCircle size={16} strokeWidth={2} className={styles.rowIcon} aria-hidden />
                          <span className={styles.rowBody}>
                            <span className={styles.rowTitle}>
                              [{target.name}에게] {q.question}
                            </span>
                          </span>
                          <ChevronRight size={16} strokeWidth={2} className={styles.rowIcon} aria-hidden />
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </article>

        {error ? <p className={styles.error}>{error}</p> : null}

        {/* ⚠ 웹 전용 '증거 제시' 섹션(정본 detail 엔 없음 — 정본은 onPresent CTA). 비증인 용의자에게 증거 연동→심문. */}
        {evidence.isUnlocked && presentSuspects.length > 0 ? (
          <article className={styles.card}>
            <Kicker label="증거 제시" className={styles.kicker} />
            <p className={styles.body}>
              심문 대상에게 이 증거를 제시하려면 관련 인물 또는 질문을 선택하세요.
            </p>
            <div className={styles.pills}>
              {presentSuspects.map((s) => (
                <button
                  key={s.suspectId}
                  className={styles.pillBtn}
                  onClick={() => onChat(s, presentPrefill(s, `${evidence.title}을 보고 설명해 주세요.`))}
                  type="button"
                >
                  <Pill label={s.name} tone="mute" />
                </button>
              ))}
            </div>
          </article>
        ) : null}

        {evidences.length > 0 ? (
          <p className={styles.muted}>확보/잠긴 증거 {evidences.length}개 중 선택됨</p>
        ) : null}
      </div>
    </section>
  );
}
