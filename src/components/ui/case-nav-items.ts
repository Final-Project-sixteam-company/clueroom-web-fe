import { Home, FileText, Users, Clock, Star } from "lucide-react";
import type { BottomNavItem } from "./BottomNav";

// 정본 5탭 (ms_bottom_nav.dart _kItems) → lucide 매핑.
//   현장   Icons.home_outlined        → Home
//   증거   Icons.description_outlined → FileText
//   용의자 Icons.people_outline       → Users
//   타임라인 Icons.schedule_outlined   → Clock
//   제출   Icons.star_outline         → Star
export const CASE_NAV_ITEMS: BottomNavItem[] = [
  { label: "현장", icon: Home },
  { label: "증거", icon: FileText },
  { label: "용의자", icon: Users },
  { label: "타임라인", icon: Clock },
  { label: "제출", icon: Star },
];
