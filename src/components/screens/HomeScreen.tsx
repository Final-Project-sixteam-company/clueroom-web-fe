import { CircleUserRound } from "lucide-react";
import { Button, Pill } from "../ui";
import styles from "./HomeScreen.module.css";

// 픽셀 정본: lib/screens/home_screen.dart (HomeScreen / _Header / _WelcomeBanner)
//   헤더(ClueRoom titleL + 프로필 아이콘) → 16:9 웰컴 배너(ink900→teal 그라디언트,
//   MYSTERY LIBRARY · '탐정 사무소' pill · titleM · subtitle · ghost CTA) → 하단 액션 버튼.
// 데이터/동작은 웹 보존(koo #4): 로그인 CTA(미로그인)·진행 중 수사 복귀(hasSession)·수사 기록.

export interface HomeScreenProps {
  isLoggedIn: boolean;
  hasSession: boolean;
  onLogin: () => void;
  onBrowse: () => void;
  onProfile: () => void;
  onRecords: () => void;
  onResume: () => void;
}

export function HomeScreen({ isLoggedIn, hasSession, onLogin, onBrowse, onProfile, onRecords, onResume }: HomeScreenProps) {
  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <h1 className={styles.brand}>ClueRoom</h1>
        <button type="button" className={styles.profileBtn} onClick={onProfile} aria-label="내 정보">
          <CircleUserRound size={24} strokeWidth={2} aria-hidden />
        </button>
      </header>

      <div className={styles.banner}>
        <span className={styles.eyebrow}>MYSTERY LIBRARY</span>
        <div className={styles.spacer} />
        <Pill label="탐정 사무소" tone="primary" />
        <h2 className={styles.bannerTitle}>사건을 수사할 시간</h2>
        <p className={styles.bannerSub}>라이브러리에서 사건을 골라 단서와 진술을 대조하세요.</p>
        <div className={styles.bannerCta}>
          <Button label="사건 보러 가기" variant="ghost" onPress={onBrowse} />
        </div>
      </div>

      <div className={styles.actions}>
        {!isLoggedIn ? <Button label="로그인" expanded onPress={onLogin} /> : null}
        {hasSession ? (
          <Button label="진행 중인 수사로 돌아가기" variant="secondary" expanded onPress={onResume} />
        ) : null}
        <Button label="수사 기록" variant="secondary" expanded onPress={onRecords} />
      </div>
    </div>
  );
}
