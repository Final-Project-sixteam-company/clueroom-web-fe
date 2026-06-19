// 정본: lib/screens/result_screen.dart (+ result_widgets.dart, result_cards.dart)
//   bare AppBar('CASE CLOSED') + 등급 헤더(fade-in) + 채점 매칭 카드 + 맞춘/놓친 추리 + 사건 해설 + 확인된 증거.
// 웹 보존(koo #4): 컨트롤드 — result 데이터·폴링은 App 소유(정본은 화면 내부 폴링). result prop 만 렌더.
//   prop 계약 = 기존 인라인 ResultScreen 동일 → App.tsx 호출부 무변경(태그명만 교체).
// ⚠ 정본 차이: 정본은 '홈으로 돌아가기' 단일 버튼인데, 웹은 다른 사건/리뷰/홈 3버튼(웹 동작 보존).
//   '다음 추천 사건' 섹션은 웹 전용(정본 result 엔 없음).
import { CircleCheck, CircleX, FileQuestion } from "lucide-react";
import type { Result } from "../../types";
import { Kicker, Pill, Button, Empty } from "../ui";
import { AssetImage } from "../domain";
import styles from "./ResultScreen.module.css";

function MatchRow({
  label,
  matched,
  trailing,
}: {
  label: string;
  matched: boolean;
  trailing?: string;
}) {
  return (
    <div className={styles.matchRow}>
      {matched ? (
        <CircleCheck size={18} strokeWidth={2} className={styles.matchOn} aria-hidden />
      ) : (
        <CircleX size={18} strokeWidth={2} className={styles.matchOff} aria-hidden />
      )}
      <span className={styles.matchLabel}>{label}</span>
      <span className={matched ? styles.matchTagOn : styles.matchTagOff}>
        {trailing ?? (matched ? "정답" : "오답")}
      </span>
    </div>
  );
}

function PartRow({ text, matched }: { text: string; matched: boolean }) {
  return (
    <div className={styles.partRow}>
      {matched ? (
        <CircleCheck size={18} strokeWidth={2} className={styles.matchOn} aria-hidden />
      ) : (
        <CircleX size={18} strokeWidth={2} className={styles.matchOff} aria-hidden />
      )}
      <span className={matched ? styles.partText : styles.partTextMuted}>{text}</span>
    </div>
  );
}

export interface ResultScreenProps {
  result: Result | null;
  onHome: () => void;
  onLibrary: () => void;
  onWriteReview?: () => void;
}

export function ResultScreen({ result, onHome, onLibrary, onWriteReview }: ResultScreenProps) {
  return (
    <section className={styles.screen}>
      <header className={styles.bar}>
        <span className={styles.barTitle}>CASE CLOSED</span>
      </header>

      {!result ? (
        <div className={styles.stateWrap}>
          <Empty
            icon={FileQuestion}
            title="결과 세션이 없습니다"
            subtitle="결과를 다시 확인해 주세요."
            action={<Button label="홈으로 돌아가기" onPress={onHome} />}
          />
        </div>
      ) : (
        <div className={styles.scroll}>
          {/* 등급 헤더 */}
          <div className={styles.gradeHeader}>
            <span
              className={`${styles.grade} ${result.grade === "S" || result.grade === "A" ? styles.gradeTop : ""}`}
            >
              {result.grade}
            </span>
            <span className={styles.score}>{result.score} / 100 PTS</span>
          </div>

          {/* 추리 채점 결과 */}
          <Kicker label="추리 채점 결과" className={styles.kicker} />
          <div className={styles.card}>
            <MatchRow label="진범 지목" matched={result.matched?.culprit === true} />
            <MatchRow label="범행 동기" matched={result.matched?.motive === true} />
            <MatchRow label="범행 방법" matched={result.matched?.method === true} />
            <MatchRow label="은폐 방법" matched={result.matched?.coverUp === true} />
            <MatchRow
              label="증거 일치"
              matched={(result.matched?.keyEvidences ?? 0) > 0}
              trailing={`${result.matched?.keyEvidences ?? 0}개 일치`}
            />
          </div>

          {/* 맞춘 · 놓친 추리 */}
          {result.matchedParts?.length || result.missedParts?.length ? (
            <>
              <Kicker label="맞춘 추리 · 놓친 추리" className={styles.kicker} />
              <div className={styles.card}>
                {(result.matchedParts ?? []).map((p) => (
                  <PartRow key={`m-${p}`} text={p} matched />
                ))}
                {(result.missedParts ?? []).map((p) => (
                  <PartRow key={`x-${p}`} text={p} matched={false} />
                ))}
              </div>
            </>
          ) : null}

          {/* 사건의 진상 · 해설 */}
          <Kicker label="사건의 진상 · 해설" className={styles.kicker} />
          <div className={styles.revelationCard}>
            <p className={styles.culprit}>
              진범: {result.correctCulprit?.name ?? "미상"}
              {result.correctCulprit?.role ? ` · ${result.correctCulprit.role}` : ""}
            </p>
            {result.feedback ? <p className={styles.feedback}>{result.feedback}</p> : null}
            {result.fullExplanation ? (
              <p className={styles.explanation}>{result.fullExplanation}</p>
            ) : null}
          </div>

          {/* 확인된 증거 */}
          {result.keyEvidences?.length ? (
            <>
              <Kicker label="확인된 증거" className={styles.kicker} />
              <div className={styles.pills}>
                {result.keyEvidences.map((e, i) => (
                  <Pill key={`${e.evidenceId ?? i}-${e.title}`} label={e.title} tone="primary" />
                ))}
              </div>
            </>
          ) : null}

          {/* 다음 추천 사건(웹 전용) */}
          {result.nextRecommendedScenarios?.length ? (
            <>
              <Kicker label="다음 추천 사건" className={styles.kicker} />
              <div className={styles.recs}>
                {result.nextRecommendedScenarios.map((s) => (
                  <div className={styles.recCard} key={s.scenarioId}>
                    <AssetImage
                      src={s.thumbnailUrl}
                      alt={s.title}
                      width={56}
                      height={56}
                      radius={8}
                      fit="cover"
                    />
                    <span className={styles.recInfo}>
                      <span className={styles.recTitle}>{s.title}</span>
                      {s.description ? (
                        <span className={styles.recDesc}>{s.description}</span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div className={styles.actions}>
            <Button label="다른 사건 보기" variant="primary" expanded onPress={onLibrary} />
            {onWriteReview ? (
              <Button label="리뷰 작성" variant="secondary" expanded onPress={onWriteReview} />
            ) : null}
            <Button label="홈으로" variant="ghost" expanded onPress={onHome} />
          </div>
        </div>
      )}
    </section>
  );
}
