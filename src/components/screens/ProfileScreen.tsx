import { useState } from "react";
import {
  Bookmark,
  Bell,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, Modal, useToast } from "../ui";
import { AssetImage } from "../domain";
import { initials } from "../../api/normalizers";
import type { UserProfile } from "../../types";
import styles from "./ProfileScreen.module.css";

// 픽셀 정본: lib/screens/my_page_screen.dart
//   헤더(마이페이지 titleL + PROFILE monoLabel) → 프로필 카드 → 메뉴 목록(준비중/로그아웃).
//
// 충실도 방침(koo #4 + koo 확정 2026-06-20): 픽셀=Flutter, 데이터/동작=웹 보존.
//   · 구조 = Flutter 충실 + 북마크 진입 보존(koo 확정): 메뉴 = [저장한 사건(북마크 유일 진입점) ·
//     알림 설정(준비중) · 도움말/튜토리얼(준비중) · 이용약관(준비중) · 로그아웃(확인 모달)].
//     stats-grid 제거(내 기록 화면이 통계 소유 → 중복 제거). 수사기록·라이브러리 메뉴는
//     하단 네비 탭과 중복이라 제거.
//   · 프로필 카드는 웹 실데이터(nickname/email/profileImageUrl) — Flutter 의 하드코딩 '탐정견습생'/
//     'detective@clueroom.xyz' placeholder 대신. 아바타는 이미지 우선 + 그라디언트 이니셜 폴백.
//   · '준비 중' 항목 = Flutter SnackBar → 킷 useToast. 로그아웃 = Flutter showMSModal → 킷 Modal.
//   · 동기화 에러 카드는 Flutter 엔 없는 웹 전용(프로필 로드 실패 시 재시도, koo #4 동작 보존).
//   · 가로 패딩은 Shell <main>(20px) 상속(타 탭 화면과 동일).

type MenuAction =
  | { kind: "nav"; run: () => void }
  | { kind: "comingSoon" }
  | { kind: "logout" };

interface MenuRowData {
  label: string;
  icon: LucideIcon;
  action: MenuAction;
}

export interface ProfileScreenProps {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onBookmarks: () => void;
  onLogout: () => void;
}

export function ProfileScreen({
  profile,
  loading,
  error,
  onRefresh,
  onBookmarks,
  onLogout,
}: ProfileScreenProps) {
  const toast = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const displayName = profile?.nickname ?? "탐정 견습생";
  const email = profile?.email ?? "웹 로그인 사용자";

  const menu: MenuRowData[] = [
    { label: "저장한 사건", icon: Bookmark, action: { kind: "nav", run: onBookmarks } },
    { label: "알림 설정", icon: Bell, action: { kind: "comingSoon" } },
    { label: "도움말 / 튜토리얼", icon: HelpCircle, action: { kind: "comingSoon" } },
    { label: "이용약관", icon: FileText, action: { kind: "comingSoon" } },
    { label: "로그아웃", icon: LogOut, action: { kind: "logout" } },
  ];

  function handle(item: MenuRowData) {
    switch (item.action.kind) {
      case "nav":
        item.action.run();
        break;
      case "comingSoon":
        toast.show(`${item.label} · 준비 중입니다`);
        break;
      case "logout":
        setLogoutOpen(true);
        break;
    }
  }

  return (
    <section className={styles.profile}>
      <header className={styles.head}>
        <h1 className={styles.title}>마이페이지</h1>
        <span className={styles.eyebrow}>PROFILE</span>
      </header>

      <article className={styles.card}>
        <div className={styles.avatar}>
          <AssetImage
            src={profile?.profileImageUrl}
            alt={`${displayName} 프로필`}
            width={56}
            height={56}
            radius={28}
            fit="cover"
            className={styles.avatarImg}
            fallback={
              <span className={styles.avatarFallback} aria-hidden>
                {initials(displayName)}
              </span>
            }
          />
        </div>
        <div className={styles.cardMeta}>
          <span className={styles.name}>{displayName}</span>
          <span className={styles.email}>{email}</span>
        </div>
      </article>

      {error ? (
        <article className={styles.syncCard}>
          <p className={styles.syncTitle}>동기화 안내</p>
          <p className={styles.syncBody}>{error}</p>
          <Button
            label={loading ? "동기화 중" : "다시 확인"}
            variant="secondary"
            onPress={loading ? undefined : onRefresh}
          />
        </article>
      ) : null}

      <div className={styles.menu}>
        {menu.map((item) => (
          <MenuRow
            key={item.label}
            label={item.label}
            icon={item.icon}
            danger={item.action.kind === "logout"}
            onPress={() => handle(item)}
          />
        ))}
      </div>

      <Modal
        open={logoutOpen}
        title="로그아웃"
        onClose={() => setLogoutOpen(false)}
        secondaryAction={
          <Button
            label="취소"
            variant="secondary"
            expanded
            onPress={() => setLogoutOpen(false)}
          />
        }
        primaryAction={
          <Button
            label="로그아웃"
            variant="danger"
            expanded
            onPress={() => {
              setLogoutOpen(false);
              onLogout();
            }}
          />
        }
      >
        <p className={styles.modalBody}>
          정말 로그아웃하시겠어요?
          <br />
          다시 로그인할 때까지 진행 중인 정보에 접근할 수 없어요.
        </p>
      </Modal>
    </section>
  );
}

// ── 메뉴 아이템 (_MenuItem) — 아이콘 + 라벨 + chevron ─────────────────────────────
function MenuRow({
  label,
  icon: Icon,
  danger,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  danger: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.menuItem} ${danger ? styles.menuDanger : ""}`}
      onClick={onPress}
    >
      <Icon size={18} strokeWidth={2} className={styles.menuIcon} aria-hidden />
      <span className={styles.menuLabel}>{label}</span>
      <ChevronRight
        size={16}
        strokeWidth={2}
        className={styles.menuChevron}
        aria-hidden
      />
    </button>
  );
}
