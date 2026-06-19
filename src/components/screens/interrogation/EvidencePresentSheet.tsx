// 정본(근사): components/game_modals.dart showEvidencePresentModal(바텀시트) + 웹 EvidencePickerDialog 동작.
//   드래그 핸들 + 검색 + 보유(해금) 증거 리스트 → 선택 시 onSelect(evidenceId). 슬라이드업 + scrim 닫힘.
// ⚠ 정본 game_modals(EvidencePresentSheet)는 아직 미이식 — 기능 이식(드래그 제스처/퇴장 모션 생략).
//   game_modals 슬라이스에서 정본 픽셀로 교체 예정. 데이터/검색은 웹 EvidencePickerDialog 보존.
import { useState } from "react";
import { createPortal } from "react-dom";
import { Search, SearchX, X } from "lucide-react";
import type { Evidence } from "../../../types";
import { TextField, Kicker, Empty } from "../../ui";
import { EvidenceThumb, evidenceCategoryIcon, evidenceCategoryLabel } from "../../domain";
import styles from "./EvidencePresentSheet.module.css";

export interface EvidencePresentSheetProps {
  evidences: Evidence[];
  selectedEvidenceId?: number;
  onClose: () => void;
  onSelect: (evidenceId: number) => void;
}

export function EvidencePresentSheet({
  evidences,
  selectedEvidenceId,
  onClose,
  onSelect,
}: EvidencePresentSheetProps) {
  const [query, setQuery] = useState("");

  const keyword = query.trim();
  const filtered = evidences.filter(
    (e) =>
      !keyword ||
      e.title.includes(keyword) ||
      (e.locationName ?? "").includes(keyword) ||
      (e.categoryLabel ?? e.category ?? "").includes(keyword),
  );

  return createPortal(
    <div className={styles.scrim} onClick={onClose} role="presentation">
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="제시할 증거 선택"
      >
        <div className={styles.handle} />
        <div className={styles.header}>
          <Kicker label="제시할 증거 · PRESENT EVIDENCE" />
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="닫기"
            type="button"
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className={styles.search}>
          <TextField
            value={query}
            onChange={setQuery}
            placeholder="보유한 증거 검색"
            suffixIcon={Search}
            ariaLabel="증거 검색"
          />
        </div>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Empty icon={SearchX} title="일치하는 증거가 없습니다" />
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map((e) => (
              <button
                key={e.evidenceId}
                className={`${styles.row} ${e.evidenceId === selectedEvidenceId ? styles.rowActive : ""}`}
                onClick={() => onSelect(e.evidenceId)}
                type="button"
              >
                <EvidenceThumb
                  icon={evidenceCategoryIcon(e.category)}
                  src={e.imageUrl}
                  size={40}
                />
                <span className={styles.rowInfo}>
                  <span className={styles.rowTitle}>{e.title}</span>
                  <span className={styles.rowMeta}>
                    {(e.locationName ?? "위치 미상") +
                      " · " +
                      (e.categoryLabel ??
                        (e.category ? evidenceCategoryLabel(e.category) : "증거"))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
