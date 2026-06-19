import { useEffect, useState } from "react";
import { Sheet, Button } from "../ui";
import type { ReviewDraftTarget, ScenarioReview } from "../../types";
import styles from "./ReviewWriteSheet.module.css";

// 픽셀 정본: lib/components/review_write_sheet.dart (ReviewWriteSheet)
//   제목('리뷰 작성' titleM) + 평점 슬라이더(★ 1.0~5.0, 0.5 step) + 본문(4줄) + 스포일러 스위치 + 등록.
//   공유 Sheet 프리미티브(슬라이드 모션 + 핸들) 위. 데이터/동작은 웹 보존(koo #4):
//   · 등록 → onSubmit(ScenarioReview) → App.addScenarioReview(저장 성공 시 target 클리어 = 닫힘).
//   · 평점은 Flutter Slider(divisions 8 = 0.5 step) 충실 — 웹 옛 정수 1~5 대비 반별점 허용(픽셀 우선).
//   · target 은 닫힐 때 null 이 되므로 마지막 유효 target 을 latch(퇴장 애니메이션 동안 콘텐츠 보존).

export interface ReviewWriteSheetProps {
  open: boolean;
  target: ReviewDraftTarget | null;
  authorName: string;
  onClose: () => void;
  onSubmit: (review: ScenarioReview) => void;
}

export function ReviewWriteSheet({
  open,
  target,
  authorName,
  onClose,
  onSubmit,
}: ReviewWriteSheetProps) {
  // 퇴장 애니메이션 동안 콘텐츠 유지용 latch.
  const [shown, setShown] = useState(target);
  useEffect(() => {
    if (target) setShown(target);
  }, [target]);

  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(false);

  // 새 리뷰가 열릴 때마다 폼 초기화.
  useEffect(() => {
    if (open) {
      setRating(5);
      setBody("");
      setSpoiler(false);
    }
  }, [open, target?.scenarioId]);

  const active = target ?? shown;
  const canSubmit = body.trim().length > 0;

  function handleSubmit() {
    if (!active || !canSubmit) return;
    onSubmit({
      reviewId: `review-${Date.now()}`,
      scenarioId: active.scenarioId,
      authorName,
      rating,
      body: body.trim(),
      createdAt: new Date().toISOString(),
      isSpoiler: spoiler,
    });
  }

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="리뷰 작성">
      <h2 className={styles.title}>리뷰 작성</h2>

      <div className={styles.ratingRow}>
        <span className={styles.ratingLabel}>평점</span>
        <span className={styles.ratingValue}>★ {rating.toFixed(1)}</span>
      </div>
      <input
        className={styles.slider}
        type="range"
        min={1}
        max={5}
        step={0.5}
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        aria-label="평점"
      />

      <div className={styles.bodyBox}>
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="이 사건은 어떠셨나요?"
          aria-label="리뷰 내용"
        />
      </div>

      <div className={styles.spoilerRow}>
        <button
          type="button"
          role="switch"
          aria-checked={spoiler}
          aria-label="스포일러 포함"
          className={`${styles.switch} ${spoiler ? styles.switchOn : ""}`}
          onClick={() => setSpoiler((v) => !v)}
        >
          <span className={styles.switchThumb} />
        </button>
        <span className={`${styles.spoilerLabel} ${spoiler ? styles.spoilerOn : ""}`}>
          스포일러 포함
        </span>
      </div>

      <div className={styles.footer}>
        <Button
          label="리뷰 등록"
          variant="primary"
          expanded
          onPress={canSubmit ? handleSubmit : undefined}
        />
      </div>
    </Sheet>
  );
}
