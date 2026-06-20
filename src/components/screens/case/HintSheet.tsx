import { Lock } from "lucide-react";
import { Sheet, Button } from "../../ui";
import type { Hint } from "../../../types";
import styles from "./HintSheet.module.css";

// 픽셀 정본: lib/components/game_modals.dart _HintSheet / _HintTile.
//   제목('힌트 요청' titleL) + 감점 경고 + 누적 감점 박스 + 힌트 타일(사용완료/잠김/사용가능).
//   공유 Sheet 프리미티브(슬라이드 모션 + 핸들) 위. 데이터/동작은 웹 보존(koo #4):
//   · 힌트는 App 이 케이스와 함께 로드(hints prop) → 시트 자체 로딩/에러 없음(Flutter 는 자체 load).
//   · 사용 = onUse(hint) → App.useHint(엔드포인트). per-hint '사용 중...' busy 는 웹 미추적이라 생략.

const LEVEL_LABEL: Record<number, string> = {
  1: "방향 힌트",
  2: "증거 연결 힌트",
  3: "결정적 힌트",
};
function levelLabel(level: number): string {
  return LEVEL_LABEL[level] ?? "힌트";
}

export interface HintSheetProps {
  open: boolean;
  hints: Hint[];
  onUse: (hint: Hint) => void;
  onClose: () => void;
}

export function HintSheet({ open, hints, onUse, onClose }: HintSheetProps) {
  const usedPenalty = hints
    .filter((h) => h.isUsed)
    .reduce((sum, h) => sum + h.penaltyScore, 0);

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="힌트 요청">
      <h2 className={styles.title}>힌트 요청</h2>
      <p className={styles.warn}>힌트 사용 시 최종 점수가 감점됩니다.</p>
      {usedPenalty > 0 ? (
        <div className={styles.penalty}>누적 감점: -{usedPenalty}점</div>
      ) : null}

      <div className={styles.list}>
        {hints.length === 0 ? (
          <p className={styles.empty}>아직 사용할 수 있는 힌트가 없습니다.</p>
        ) : (
          hints.map((h) => (
            <HintTile
              key={h.hintId}
              hint={h}
              label={levelLabel(h.hintLevel)}
              onUse={() => onUse(h)}
            />
          ))
        )}
      </div>
    </Sheet>
  );
}

// ── 힌트 타일 (_HintTile) ────────────────────────────────────────────────────────
function HintTile({
  hint,
  label,
  onUse,
}: {
  hint: Hint;
  label: string;
  onUse: () => void;
}) {
  // 사용 완료: 라벨 + 감점 + 힌트 내용
  if (hint.isUsed) {
    return (
      <div className={styles.usedTile}>
        <div className={styles.usedHead}>
          <span className={styles.usedLabel}>{label}</span>
          <span className={styles.usedPenalty}>-{hint.penaltyScore}점</span>
        </div>
        {hint.content ? (
          <p className={styles.usedContent}>{hint.content}</p>
        ) : null}
      </div>
    );
  }

  // 잠김: 해금 대기 안내(비활성)
  if (!hint.isAvailable) {
    const mins = hint.remainingMinutes;
    const suffix = mins != null && mins > 0 ? ` · ${mins}분 후 해금` : " · 잠김";
    return (
      <Button
        label={`${label}${suffix}`}
        variant="ghost"
        icon={Lock}
        expanded
        onPress={undefined}
      />
    );
  }

  // 사용 가능: 사용 버튼(level 3+ danger)
  return (
    <Button
      label={`${label} (-${hint.penaltyScore}점)`}
      variant={hint.hintLevel >= 3 ? "danger" : "secondary"}
      expanded
      onPress={onUse}
    />
  );
}
