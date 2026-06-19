// ClueRoom 도메인 컴포넌트 — 픽셀 정본 = Flutter lib/components/*.dart, 데이터 = 웹 도메인 타입.
// 프리미티브 킷(../ui) 위에 올림. 동작은 props(콜백)로 분리(프리젠테이션).

export { AssetImage, CharacterPortrait, EvidenceThumb, ScenarioCoverImage } from "./AssetImage";
export type {
  AssetImageProps,
  CharacterPortraitProps,
  EvidenceThumbProps,
  ScenarioCoverImageProps,
} from "./AssetImage";

export { evidenceCategoryIcon, evidenceCategoryLabel } from "./evidence-icons";

export { EvidenceTile, EvidenceCategoryBadge } from "./EvidenceTile";
export type { EvidenceTileProps } from "./EvidenceTile";

export { EvidenceItem } from "./EvidenceItem";
export type { EvidenceItemProps } from "./EvidenceItem";

export { SuspectCard } from "./SuspectCard";
export type { SuspectCardProps } from "./SuspectCard";

export { TimelineList } from "./TimelineList";
export type { TimelineListProps, TimelineRow } from "./TimelineList";

export { ScenarioRow } from "./ScenarioRow";
export type { ScenarioRowProps } from "./ScenarioRow";

export { ImageViewerModal } from "./ImageViewerModal";
export type { ImageViewerModalProps } from "./ImageViewerModal";
