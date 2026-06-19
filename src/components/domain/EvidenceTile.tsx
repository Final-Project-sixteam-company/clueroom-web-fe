import { Lock } from "lucide-react";
import type { Evidence } from "../../types";
import { Pill } from "../ui";
import { EvidenceThumb } from "./AssetImage";
import { evidenceCategoryIcon, evidenceCategoryLabel } from "./evidence-icons";
import styles from "./EvidenceTile.module.css";

// 픽셀 정본: lib/components/evidence_tile.dart (EvidenceTile / _Tile)
//   카드 pad 16×12, r4, NEW/해금 글로우(spread2 blur0), 썸네일 34, 위치 monoLabel, 카테고리 뱃지.
//   동작(Navigator/세션)은 제거 — 프리젠테이션 + onPress 콜백. 데이터는 웹 Evidence 타입.

export interface EvidenceTileProps {
  evidence: Evidence;
  onPress?: () => void;
  /** Flutter evidence.isNew — 웹 타입엔 없음. 세션 상태로 주입(옵션). */
  isNew?: boolean;
  /** 이번에 해금됨 — success 보더 + 글로우 + '해금' 필. */
  isNewlyUnlocked?: boolean;
  /** 시간 잠금 — opacity .5 + 자물쇠. */
  isTimeLocked?: boolean;
}

export function EvidenceTile({
  evidence,
  onPress,
  isNew = false,
  isNewlyUnlocked = false,
  isTimeLocked = false,
}: EvidenceTileProps) {
  const categoryLabel =
    evidence.categoryLabel ?? (evidence.category ? evidenceCategoryLabel(evidence.category) : undefined);
  const glowClass = isNewlyUnlocked ? styles.glowSuccess : isNew ? styles.glow : "";
  const interactive = !isTimeLocked && onPress != null;

  const tile = (
    <button
      type="button"
      className={[styles.tile, isNewlyUnlocked ? styles.unlocked : "", glowClass].filter(Boolean).join(" ")}
      onClick={interactive ? onPress : undefined}
      disabled={!interactive}
    >
      <EvidenceThumb
        icon={evidenceCategoryIcon(evidence.category)}
        iconColor={isNewlyUnlocked ? "var(--success)" : "var(--primary)"}
        src={evidence.imageUrl}
        size={34}
      />
      <span className={styles.body}>
        <span className={styles.name}>{evidence.title}</span>
        <span className={styles.metaRow}>
          <span className={styles.location}>{evidence.locationName ?? "위치 미상"}</span>
          {categoryLabel ? <EvidenceCategoryBadge label={categoryLabel} /> : null}
        </span>
      </span>
      {isNewlyUnlocked ? (
        <Pill label="해금" tone="success" />
      ) : isNew ? (
        <Pill label="NEW" tone="primary" />
      ) : null}
    </button>
  );

  if (isTimeLocked) {
    return (
      <div className={styles.lockedWrap}>
        {tile}
        <Lock size={16} strokeWidth={2} className={styles.lockIcon} aria-hidden />
      </div>
    );
  }
  return tile;
}

// 정본: evidence_tile_helpers.dart EvidenceCategoryBadge — bgHover, r1, monoLabel 8.5, textMute.
export function EvidenceCategoryBadge({ label }: { label: string }) {
  return <span className={styles.categoryBadge}>{label}</span>;
}
