// 정본: components/game_modals.dart showEvidencePresentModal / _EvidencePresentSheet / _EvidencePickItem.
//   드래그 핸들 + 제목('제시할 증거 선택' titleM) + 닫기 X + 검색 + 보유(해금) 증거 리스트.
//   슬라이드업/다운 모션 + scrim = 공유 Sheet 프리미티브. 데이터/검색은 웹 EvidencePickerDialog 보존(koo #4).
//   · 리스트 아이템 = Flutter _EvidencePickItem: bg·r4·line, 34 썸네일(이미지 우선→아이콘 박스) + 이름 + 위치.
//   · 정본 DraggableScrollableSheet(가변 높이 스냅)는 미이식 — Sheet 고정 max-height + 내부 스크롤(웹 단순화).
import { useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import type { Evidence } from "../../../types";
import { Sheet, TextField, Empty } from "../../ui";
import { EvidenceThumb, evidenceCategoryIcon, evidenceCategoryLabel } from "../../domain";
import styles from "./EvidencePresentSheet.module.css";

export interface EvidencePresentSheetProps {
  open: boolean;
  evidences: Evidence[];
  selectedEvidenceId?: number;
  onClose: () => void;
  onSelect: (evidenceId: number) => void;
}

export function EvidencePresentSheet({
  open,
  evidences,
  selectedEvidenceId,
  onClose,
  onSelect,
}: EvidencePresentSheetProps) {
  const [query, setQuery] = useState("");

  const keyword = query.trim();
  // 검색은 웹 동작 보존 — 이름/위치/카테고리 모두 매칭(표시는 Flutter 대로 이름+위치만).
  const filtered = evidences.filter(
    (e) =>
      !keyword ||
      e.title.includes(keyword) ||
      (e.locationName ?? "").includes(keyword) ||
      (e.categoryLabel ?? e.category ?? "").includes(keyword),
  );

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="제시할 증거 선택" className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>제시할 증거 선택</h2>
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
          placeholder="보유한 증거 검색..."
          suffixIcon={Search}
          ariaLabel="증거 검색"
        />
      </div>

      {evidences.length === 0 ? (
        <div className={styles.empty}>
          <Empty icon={SearchX} title="제시할 수 있는 증거가 아직 없습니다" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <Empty icon={SearchX} title="일치하는 증거가 없습니다" />
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((e) => (
            <li key={e.evidenceId}>
              <button
                className={`${styles.row} ${e.evidenceId === selectedEvidenceId ? styles.rowActive : ""}`}
                onClick={() => onSelect(e.evidenceId)}
                type="button"
              >
                <EvidenceThumb
                  icon={evidenceCategoryIcon(e.category)}
                  src={e.imageUrl}
                  size={34}
                />
                <span className={styles.rowInfo}>
                  <span className={styles.rowTitle}>{e.title}</span>
                  <span className={styles.rowMeta}>
                    {e.locationName ??
                      (e.category ? evidenceCategoryLabel(e.category) : "위치 미상")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
