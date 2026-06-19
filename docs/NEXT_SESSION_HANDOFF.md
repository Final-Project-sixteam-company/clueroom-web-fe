# 다음 세션 핸드오프 — ClueRoom Flutter→React 마이그레이션

> 아래 블록을 새 Claude Code 세션(작업 디렉토리 = `clueroom-toss-miniapp`)에 그대로 붙여넣으면 돼요.

---

ClueRoom Flutter 앱(`../project-fe`)을 이 React 웹앱(`clueroom-toss-miniapp`)으로 **픽셀까지 동일하게** 마이그레이션하는 작업을 이어서 합니다. 계획은 지난 세션에서 이미 수립·저장돼 있어요.

## 먼저 읽을 것 (필수)
1. `docs/REACT_WEB_MIGRATION_PLAN.md` — 전체 계획(모듈 매핑·토큰 표·서버통신 계약·컴포넌트 킷·화면 갭·7단계 순서·리스크·열린 질문). **이게 정본이에요.**
2. `docs/REACT_WEB_MIGRATION_GAMEPLAY_SPEC.md` — 게임플레이 20개 화면 픽셀 명세(Phase 5 레퍼런스).
3. 픽셀 값 정본: `../project-fe/lib/theme/{app_colors,app_tokens,app_text,app_theme}.dart`.

## 확정된 결정 (다시 묻지 말 것)
- **방식 = 현재 앱 리팩터링**: 모놀리식 `src/App.tsx`(5,565줄) + `src/App.css`(1,656줄)를 Flutter `lib/` 구조에 맞춰 모듈 분해 + 갭 보강.
- **충실도 = 픽셀 완전 동일**: 색·간격·반경·폰트·모션 1:1.
- **다크 전용**: Flutter가 `themeMode: ThemeMode.dark`로 고정. 라이트 테마 무시.

## 재분석 금지 — 이미 밝혀진 핵심 사실
- **컬러 hex는 이미 일치**: `#0F172A`=bg(ink900), `#1E293B`=bgElev(ink800), `#334155`=line(ink700), `#38BDF8`=primary(skyBase), `#7DD3FC`=primaryInk(skyLight) 등. 컬러는 토큰화만 하면 돼요.
- **진짜 픽셀 갭 3가지**: (1) **Pretendard(400/700)·JetBrains Mono(600) 미로드** → OS 폰트로 폴백 중, (2) **CSS 변수 0개**(모든 값 리터럴 중복), (3) **폰트 weight가 웹 800/900인데 Flutter는 400/700**(mono 600).
- **간격 함정**: 웹의 13/9/11px는 "불규칙"이 아니라 Flutter 컴포넌트 토큰(`evidencePadH=13`, `evidencePadV=11`, `conflictPadH=9`, `pillPadH=7`)과 **이미 일치**. 정규화하지 말고 토큰 표로 **대조만** 할 것.
- **glow 그림자는 blur 0 + spread**(선명한 halo) — `box-shadow: 0 0 0 3px ...`. 흐린 그림자로 만들면 안 됨.
- **모션**: dur1/2/3=120/200/320ms, easeOut=`cubic-bezier(0.22,0.61,0.36,1.0)`.

## 절대 회귀시키면 안 되는 서버통신 (이미 동작 → 보존)
- `request<T>()` 엔벨로프 `{success,data,error}`, 클라 에러코드 `NETWORK_ERROR/TIMEOUT/PARSE_ERROR/AUTH_REQUIRED`.
- 401 → refresh → 1회 재시도, **single-flight(`refreshInFlightRef`) + generation guard(`authGenerationRef`)**.
- **accessToken만 localStorage + http-only refresh 쿠키**(`credentials:'include'`) — Flutter secure-storage와 의도적으로 다름, 유지.
- **30초 status-gated 폴링**(status==='PLAYING'일 때만), 1초 타이머(`loadCaseRef`), AI 엔드포인트 타임아웃 60초.
- 위 4개(refresh race·generation guard·폴링 게이팅·1초 타이머)는 분해 시 가장 깨지기 쉬움 → **추출 후 단위테스트**.

## koo 확정 (2026-06-19 — 다시 묻지 말 것, 계획 §11 참조)
1. 픽셀 기준 뷰포트 → **모바일 390 우선 + 데스크톱 반응형 유지(둘 다)**. 비주얼 diff 기준 폭 = 390.
2. 라우팅 → **`view` enum 스위치 유지** (react-router 미도입).
3. FCM 웹 푸시 → **이번 범위 제외(보류)**.
4. 정적 데이터 화면(records/profile/리뷰·평점) → **웹 실연동 유지가 정본** (Flutter 정적으로 안 되돌림).
5. Splash 2.2s 모션 / 5슬라이드 Onboarding → **둘 다 픽셀 복원**(Phase 6).

## ✅ Phase 1 — 토큰 시스템 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
- `src/theme/tokens.css` 신설 — 계획 §4.2 컬러/간격/반경/타이포/모션 + `--glow-focus`(blur0+spread3) `:root` 변수 전체. `main.tsx`에서 **가장 먼저** import.
- 폰트 self-host: Flutter가 번들하는 `Pretendard-Regular/Bold.otf`를 **woff2 변환**(fontTools, `public/fonts/`) + JetBrains Mono 600(fontsource woff2). `@font-face` 3종.
- weight 교정: `App.css`의 `font-weight 800/900` × 37 → **700** 클램프(Pretendard 400/700 번들 한계 = Flutter 최대 weight). eyebrow·timeline time → **JetBrains Mono 600** 모노 파리티.
- 토큰 배선: `index.css` + 최상단 구조 블록(app-frame/topbar/brand/icon-button)을 값 동일 토큰으로 전환(픽셀 변화 0). **대량 리터럴→var 전환은 Phase 5에서 화면 만질 때 함께**(의도적 점진).
- 게이트 통과: `lint exit=0`, `build exit=0`, dist 폰트 3종 방출 + 런타임 `font/woff2` 200 서빙 확인. (브라우저 육안 확인만 koo `npm run dev`로 남음)

## ✅ Phase 2 — 순수 레이어 분해 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
`App.tsx`에서 프레임워크 무관 레이어를 **verbatim(바이트 단위) 슬라이스**로 추출. 로직/타입 수정 0 — 순수 구조 이동이라 원본과 1:1 대조 가능.
1. `src/config/env.ts` (App.tsx 1–32) — API base/OAuth/플래그·스토리지키·앱 상수 17개 (`export const`).
2. `src/types/index.ts` (78–320) — 도메인 타입 21개 (`export type`). `import "./types"`로 참조.
3. `src/lib/storage.ts` (333–370) — `safeGet/Set/Remove`, `delay`, `getDeviceId` (`DEVICE_KEY`만 env에서 import).
4. `src/api/ApiError.ts` (322–331) + `src/api/request.ts` (452–526) — `ApiError` 클래스 / `apiUrl`·`publicImageUrl`·`firstPublicImageUrl`·`request<T>()`(엔벨로프·타임아웃·401 분기).
5. `src/api/normalizers.ts` (528–1147) — normalize/format 매퍼 21개. env(`SCENARIO_PAGE_SIZE`)·request(`firstPublicImageUrl`)·types 15종 import.
- App.tsx 재조립: **5,565 → 4,607줄**. import은 본문 실사용분만(grep 검증) — 남는 SDK 영역(`GoogleCredentialResponse`/`Window` global/스크립트 promise·로더 4종)은 Phase 3 `sdkLoaders.ts` 몫이라 그대로 둠.
- 모듈 그래프 무순환: env←storage, env←request←normalizers, ApiError←request, types는 type-only(런타임 소거). build의 36 modules transformed로 그래프 해석 확인.
- 게이트 통과: **`lint` exit=0, `build`(vite) 성공**(dist 방출). 동작 무변화 — 모든 추출은 verbatim, 로직 미변경.

### ⚠ Phase 2에서 발견한 기존 갭 (Phase 2가 만든 게 아님 — 회귀 아님)
- `npm run build`는 **`vite build`(esbuild)라 타입체크를 안 함** → 계획 §10의 "build(타입 포함)"은 사실과 다름. 타입 게이트는 **`npx tsc -b`를 따로 돌려야** 함.
- `tsc -b`가 **기존 잠재 타입 에러 5개**를 잡음 — 리팩터 전 백업 모놀리식을 단독 타입체크해도 **동일 위치·동일 5개**가 나옴(= 전부 pre-existing, Phase 2 무관 입증):
  1. `normalizers.ts:540/562` (구 App.tsx 1047/1069) `normalizeResult`의 type predicate가 `evidenceId?`/`description?`(optional)인데 map 결과는 required-but-`undefined` → TS2677.
  2. `normalizers.ts:598/599` (구 1105/1106) 위 predicate 때문에 `null` 미소거 → Result 필드 할당 TS2322.
  3. `App.tsx:728` (구 1687) auth refresh의 `refreshPromise` used-before-assigned (TS2454).
- 권고: 1~2는 predicate를 `item is NonNullable<typeof item>`로 바꾸면 **타입 전용·런타임 0** 수정으로 닫힘. 3은 **회귀 금지 refresh 로직**이라 Phase 3 `useAuth` 추출 + 단위테스트 때 함께 다루는 게 안전(지금 단독 수정 금지).

## ▶ 다음 작업: Phase 3 — 인증 + 컴포넌트 킷 (계획 §3·§9)
1. App.tsx에 남겨둔 SDK 영역 → `src/auth/sdkLoaders.ts`: `GoogleCredentialResponse` 타입·`Window` global 선언·`googleIdentityScriptPromise`/`kakaoIdentityScriptPromise`·`loadGoogleIdentityScript`/`loadKakaoIdentityScript`/`ensureKakaoInitialized`/`kakaoRedirectUri`.
2. `src/auth/authClient.ts` — auth 엔드포인트(`/api/auth/oauth|oauth/kakao/code|dev|refresh|logout`, `GET /api/auth/me`).
3. `src/auth/useAuth.ts` — god-state에서 인증 분리. ⚠ **회귀 금지 4종 중 2종 여기서 다룸**: refresh single-flight(`refreshInFlightRef`) + generation guard(`authGenerationRef`). **추출 후 단위테스트 필수**. (나머지 2종 — 30초 status-gated 폴링·1초 타이머 `loadCaseRef` — 은 Phase 4 `useGameSession`.)
4. `src/components/ui/` ms_* 13종 포팅(+중복 통합: FilterChip·ImageViewerModal) — 계획 §6.
- 게이트: refresh race 단위테스트 + `lint`/`build`/`tsc -b`. (이번부터 `tsc -b`를 게이트에 포함하되, 위 pre-existing 3은 별도 트래킹.)

## 작업 규칙
- 작업 브랜치 `feat/react-migration-tokens` 이어서 사용(또는 Phase별 분기). 커밋/푸시는 명시 요청 시에만.
- 분해(Phase 2~4)와 화면 정합(Phase 5)은 기능 단위로 인터리브 가능. 토큰(Phase 1)은 완료됨.
- 완료 주장 전 항상 `npm run lint && npm run build`로 검증.
