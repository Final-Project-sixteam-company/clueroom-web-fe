import styles from "./SplashScreen.module.css";

/**
 * 정본: lib/screens/splash_screen.dart
 * 픽셀=Flutter 레이아웃/모션. 라우팅(2.2s 후 온보딩/홈 분기)은 App 오케스트레이터가 소유하고,
 * 이 컴포넌트는 비주얼 + 진입 페이드/슬라이드(1100ms easeOut) + 펄스 라벨(900ms)만 담당.
 * 비-탭 전체화면 → 셸 bare. 라디얼 배경 + 로고 배지(크로스헤어 + CR) + ClueRoom·AI + 펄스 + 버전.
 */
export function SplashScreen() {
  return (
    <div className={styles.root}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.spacer} />
        {/* 로고 배지: 80 원형 + 십자선(CustomPaint) + CR (login_screen 오브와 동일) */}
        <div className={styles.badge}>
          <svg className={styles.crosshair} viewBox="0 0 80 80" aria-hidden="true">
            <line x1="40" y1="8" x2="40" y2="26" />
            <line x1="40" y1="54" x2="40" y2="72" />
            <line x1="8" y1="40" x2="26" y2="40" />
            <line x1="54" y1="40" x2="72" y2="40" />
          </svg>
          <span className={styles.badgeMark}>CR</span>
        </div>
        <div className={styles.brandRow}>
          <span className={styles.brand}>ClueRoom</span>
          <span className={styles.aiBadge}>AI</span>
        </div>
        <p className={styles.pulse}>INVESTIGATING · 조사 준비 중</p>
        <div className={styles.spacer} />
        <p className={styles.version}>A DETECTIVE GAME · v0.9.2</p>
      </div>
    </div>
  );
}
