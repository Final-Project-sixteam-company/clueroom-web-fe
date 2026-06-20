import { Package, FileText, Server, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// 정본: controllers/game_session_controller.dart (category → Material IconData) → lucide
//   PHYSICAL    inventory_2_outlined      → Package
//   DOCUMENT    description_outlined      → FileText
//   DIGITAL_LOG dns_outlined              → Server
//   TESTIMONY   record_voice_over_outlined→ MessageSquare
//   기타(default) description_outlined    → FileText
export function evidenceCategoryIcon(category?: string): LucideIcon {
  switch (category) {
    case "PHYSICAL":
      return Package;
    case "DOCUMENT":
      return FileText;
    case "DIGITAL_LOG":
      return Server;
    case "TESTIMONY":
      return MessageSquare;
    default:
      return FileText;
  }
}

// 정본: components/evidence_tile.dart _categoryLabel
// category 가 있을 때만 라벨 반환(없으면 undefined → 뱃지 미표시).
export function evidenceCategoryLabel(category?: string): string | undefined {
  switch (category) {
    case "PHYSICAL":
      return "물적";
    case "DOCUMENT":
      return "문서";
    case "DIGITAL_LOG":
      return "디지털";
    case "TESTIMONY":
      return "증언";
    default:
      return category ? "기타" : undefined;
  }
}
