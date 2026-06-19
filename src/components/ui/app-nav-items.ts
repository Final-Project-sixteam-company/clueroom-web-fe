import { ClipboardList, Home, Library, User } from "lucide-react";
import type { BottomNavItem } from "./BottomNav";

// 앱 셸 하단 네비 (app_shell.dart _kAppNavItems) → lucide 매핑.
// Flutter 는 5탭(홈/라이브러리/기록/만들기/내 정보)이지만 '만들기'(시나리오 빌더)는
// 웹에 빌더가 없어 제외 → 4탭 (koo 확정 2026-06-19). 홈 이식 때 '만들기' 제외와 일관.
//   홈        Icons.home_outlined          → Home
//   라이브러리 Icons.library_books_outlined → Library
//   기록      Icons.assignment_outlined    → ClipboardList
//   내 정보   Icons.person_outline         → User
export const APP_NAV_ITEMS: BottomNavItem[] = [
  { label: "홈", icon: Home },
  { label: "라이브러리", icon: Library },
  { label: "기록", icon: ClipboardList },
  { label: "내 정보", icon: User },
];
