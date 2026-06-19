import { useEffect, useRef, useState } from "react";
import { Button } from "../ui";
import {
  GOOGLE_CLIENT_ID,
  ENABLE_GOOGLE_LOGIN,
  ENABLE_KAKAO_LOGIN,
  ENABLE_DEV_LOGIN,
  ENABLE_QA_LOGIN,
  DEFAULT_QA_LOGIN_EMAIL,
  QA_LOGIN_NICKNAME,
  KAKAO_LOGIN_STATE,
} from "../../config/env";
import {
  loadGoogleIdentityScript,
  ensureKakaoInitialized,
  kakaoRedirectUri,
} from "../../auth/sdkLoaders";
import styles from "./LoginScreen.module.css";

// 픽셀 정본: lib/screens/login_screen.dart
//   80px 로고 오브(CR, primary glow) → '환영합니다'(titleL 28) → 서브타이틀 →
//   (dev/qa 로그인 게이트) → '또는' divider → Google 로그인 → Kakao 로그인.
//
// 충실도 방침(koo #4 + 2026-06-19 koo 확정): 픽셀=Flutter 레이아웃, 데이터/동작=웹 보존.
//   · 버튼 비주얼 = 배포앱 매칭(브랜드): Google=GIS 공식 버튼(웹 OAuth는 GIS 제약상 공식 버튼이
//     사실상 강제 — 임의 버튼으로 idToken 수신 불가), Kakao=노란 브랜드 버튼(#FEE500).
//     Flutter 의 동일 secondary 2버튼 대신 채택(웹 관례 + 배포앱 일치).
//   · 동작: Google GIS → onGoogleCredential(idToken) / Kakao → Auth.authorize 리다이렉트(state),
//     돌아올 때 useAuth 가 URL code+state 읽어 kakaoCodeLogin. dev/qa 는 onDevLogin. 전부 보존.
//   · Kakao 키 처리(koo 확정) = 플래그 뒤에 빌드: ENABLE_KAKAO_LOGIN(=VITE_KAKAO_JAVASCRIPT_KEY
//     존재 시) 일 때만 버튼 노출. 키 없으면 자동 숨김 → 레포에 비밀값 없음, 키 들어오면 자동 활성.

export interface LoginScreenProps {
  error: string | null;
  onGoogleCredential: (idToken: string) => void;
  onAuthError: (message: string) => void;
  onDevLogin: (
    email: string,
    nickname?: string,
    fallbackMessage?: string,
  ) => void;
}

export function LoginScreen({
  error,
  onGoogleCredential,
  onAuthError,
  onDevLogin,
}: LoginScreenProps) {
  const [devEmail, setDevEmail] = useState("tester@clueroom.local");
  const [qaEmail, setQaEmail] = useState(DEFAULT_QA_LOGIN_EMAIL);

  const showDevAffordances = ENABLE_DEV_LOGIN || ENABLE_QA_LOGIN;
  const showAnyProvider =
    ENABLE_GOOGLE_LOGIN || ENABLE_KAKAO_LOGIN || showDevAffordances;

  function submitDevLogin(
    email: string,
    nickname?: string,
    fallbackMessage?: string,
  ) {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      onAuthError("로그인 이메일을 입력하세요.");
      return;
    }
    onDevLogin(normalizedEmail, nickname, fallbackMessage);
  }

  return (
    <section className={styles.screen}>
      <div className={styles.spacerTop} aria-hidden />

      <div className={styles.orb}>
        <span className={styles.orbMark}>CR</span>
      </div>

      <h1 className={styles.title}>환영합니다</h1>
      <p className={styles.subtitle}>
        ClueRoom 사건 조사 파일에 접근하려면{"\n"}로그인해주세요.
      </p>

      <div className={styles.gap48} aria-hidden />

      {ENABLE_DEV_LOGIN ? (
        <div className={styles.devBlock}>
          <span className={styles.devLabel}>개발자 로그인 (Dev Login)</span>
          <input
            className={styles.devInput}
            type="email"
            value={devEmail}
            onChange={(event) => setDevEmail(event.target.value)}
            placeholder="이메일을 입력하세요 (예: user@example.com)"
            autoComplete="email"
          />
          <Button
            label="로그인"
            expanded
            onPress={() => submitDevLogin(devEmail)}
          />
        </div>
      ) : null}

      {ENABLE_QA_LOGIN ? (
        <div className={styles.devBlock}>
          <span className={styles.devLabel}>QA 테스트 계정</span>
          <input
            className={styles.devInput}
            type="email"
            value={qaEmail}
            onChange={(event) => setQaEmail(event.target.value)}
            placeholder="QA 계정 이메일"
            autoComplete="email"
          />
          <Button
            label="QA 테스트 계정 로그인"
            variant="secondary"
            expanded
            onPress={() =>
              submitDevLogin(qaEmail, QA_LOGIN_NICKNAME, "QA 로그인에 실패했습니다.")
            }
          />
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      {showDevAffordances && (ENABLE_GOOGLE_LOGIN || ENABLE_KAKAO_LOGIN) ? (
        <div className={styles.divider}>
          <span className={styles.dividerLine} aria-hidden />
          <span className={styles.dividerText}>또는</span>
          <span className={styles.dividerLine} aria-hidden />
        </div>
      ) : null}

      <div className={styles.providers}>
        <GoogleSignInButton
          onCredential={onGoogleCredential}
          onError={onAuthError}
        />
        <KakaoSignInButton onError={onAuthError} />
      </div>

      {!showAnyProvider ? (
        <p className={styles.notice}>
          웹 로그인을 사용하려면 <code>VITE_GOOGLE_CLIENT_ID</code> 또는{" "}
          <code>VITE_KAKAO_JAVASCRIPT_KEY</code>가 필요합니다.
        </p>
      ) : null}
    </section>
  );
}

// ── Google: GIS 공식 버튼(웹 OAuth 제약상 Google 위젯 렌더 필수) ──────────────────
function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ENABLE_GOOGLE_LOGIN || !buttonRef.current) return;

    let cancelled = false;
    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              onCredential(response.credential);
              return;
            }
            onError("Google 인증 토큰을 받지 못했습니다.");
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(400, buttonRef.current.clientWidth || 360),
        });
      })
      .catch((sdkError) => {
        if (cancelled) return;
        onError(
          sdkError instanceof Error
            ? sdkError.message
            : "Google 로그인 준비에 실패했습니다.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  if (!ENABLE_GOOGLE_LOGIN) return null;

  return (
    <div className={styles.googleBox}>
      <div ref={buttonRef} />
    </div>
  );
}

// ── Kakao: 노란 브랜드 버튼 → Auth.authorize 리다이렉트(state) ────────────────────
function KakaoSignInButton({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!ENABLE_KAKAO_LOGIN) return null;

  async function handleClick() {
    setLoading(true);
    try {
      await ensureKakaoInitialized();
      window.Kakao?.Auth.authorize({
        redirectUri: kakaoRedirectUri(),
        state: KAKAO_LOGIN_STATE,
      });
    } catch (sdkError) {
      setLoading(false);
      onError(
        sdkError instanceof Error
          ? sdkError.message
          : "Kakao 로그인 준비에 실패했습니다.",
      );
    }
  }

  return (
    <button
      type="button"
      className={styles.kakaoButton}
      disabled={loading}
      onClick={handleClick}
    >
      <KakaoSymbol />
      <span>{loading ? "카카오 로그인 준비 중" : "카카오로 시작하기"}</span>
    </button>
  );
}

// Kakao 말풍선 심볼(브랜드 마크 근사). 색은 currentColor(노란 버튼 위 ink950).
function KakaoSymbol() {
  return (
    <svg
      className={styles.kakaoSymbol}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 3.6C6.9 3.6 2.8 6.9 2.8 11c0 2.6 1.7 4.9 4.3 6.2-.2.7-.7 2.5-.8 2.9-.1.5.2.5.4.4.2-.1 2.4-1.6 3.3-2.3.6.1 1.3.2 2 .2 5.1 0 9.2-3.3 9.2-7.4S17.1 3.6 12 3.6z"
      />
    </svg>
  );
}
