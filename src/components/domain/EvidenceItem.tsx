import type { Evidence } from "../../types";
import { Pill } from "../ui";
import { EvidenceThumb } from "./AssetImage";
import { evidenceCategoryIcon } from "./evidence-icons";
import styles from "./EvidenceItem.module.css";

// 픽셀 정본: lib/components/evidence_item.dart (EvidenceItem)
//   suspect 상세 전용. 아이콘 박스(이미지 아님) + '확보됨' 필. pad 13×11, r4.
//   EvidenceTile(주력)과 역할 구분 — 둘 다 필요.

export interface EvidenceItemProps {
  evidence: Evidence;
  onPress?: () => void;
  /** Flutter evidence.isNew — 옵션(웹 타입엔 없음). */
  isNew?: boolean;
}

export function EvidenceItem({ evidence, onPress, isNew = false }: EvidenceItemProps) {
  return (
    <button
      type="button"
      className={[styles.item, isNew ? styles.glow : ""].filter(Boolean).join(" ")}
      onClick={onPress}
      disabled={onPress == null}
    >
      <EvidenceThumb icon={evidenceCategoryIcon(evidence.category)} iconColor="var(--primary)" size={34} />
      <span className={styles.body}>
        <span className={styles.name}>{evidence.title}</span>
        <span className={styles.location}>{evidence.locationName ?? "위치 미상"}</span>
      </span>
      <Pill label="확보됨" tone="primary" />
    </button>
  );
}
