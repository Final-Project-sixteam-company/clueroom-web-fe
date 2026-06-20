import { KAKAO_JAVASCRIPT_KEY } from "../config/env";

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    Kakao?: {
      init: (javascriptKey: string) => void;
      isInitialized: () => boolean;
      Auth: {
        authorize: (options: {
          redirectUri: string;
          state?: string;
        }) => void;
      };
    };
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;
let kakaoIdentityScriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("google-identity-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google 로그인 스크립트를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Google 로그인 스크립트를 불러오지 못했습니다.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

export function loadKakaoIdentityScript() {
  if (window.Kakao) return Promise.resolve();
  if (kakaoIdentityScriptPromise) return kakaoIdentityScriptPromise;

  kakaoIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("kakao-identity-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Kakao 로그인 스크립트를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-identity-script";
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Kakao 로그인 스크립트를 불러오지 못했습니다.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return kakaoIdentityScriptPromise;
}

export async function ensureKakaoInitialized() {
  await loadKakaoIdentityScript();
  if (!window.Kakao) {
    throw new Error("Kakao 로그인 SDK를 사용할 수 없습니다.");
  }
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
  }
}

export function kakaoRedirectUri() {
  return window.location.origin;
}
