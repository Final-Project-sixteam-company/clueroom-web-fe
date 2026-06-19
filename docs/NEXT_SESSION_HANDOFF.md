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

### 🔧 Phase 2에서 발견한 기존 갭 → Phase 3a에서 전부 해소
- `npm run build`는 **`vite build`(esbuild)라 타입체크를 안 함** → 계획 §10의 "build(타입 포함)"은 사실과 다름. **타입 게이트는 `npx tsc -b`** 가 정본. (Phase 3a부터 게이트에 정식 포함.)
- `tsc -b`가 잡았던 **기존 잠재 타입 에러 5개**(백업 모놀리식 단독 타입체크에서도 동일 5개 → 전부 pre-existing 입증)는 **Phase 3a에서 0개로 닫음**:
  - `normalizers.ts` 4개(`normalizeResult`의 keyEvidences/recommendations predicate) → `item is NonNullable<typeof item>` **타입 전용** 수정.
  - auth refresh `refreshPromise` used-before-assigned 1개 → 아래 refreshController 추출로 자연 해소.

## ✅ Phase 3a — SDK 로더 추출 + refresh 컨트롤러(테스트) 완료 (2026-06-19)
1. `src/auth/sdkLoaders.ts` — App.tsx의 SDK 영역 **verbatim 추출**: `GoogleCredentialResponse`·`Window` global 선언·스크립트 promise 2개·`load{Google,Kakao}IdentityScript`/`ensureKakaoInitialized`/`kakaoRedirectUri`. `KAKAO_JAVASCRIPT_KEY`만 env에서 import. App는 3개(loadGoogle/ensureKakao/kakaoRedirect)만 import하고 `KAKAO_JAVASCRIPT_KEY` import는 제거(미사용화).
2. `src/auth/refreshController.ts` — **refresh 단일비행 + generation guard를 React 무관 순수 컨트롤러로 추출**. `createRefreshController()` → `{ generation, bumpGeneration(), reset(), refresh(handlers) }`. App.tsx 재배선: 두 ref(`refreshInFlightRef`/`authGenerationRef`) → 컨트롤러 ref 1개. 부트스트랩 가드는 `controller.generation`, `replaceAuthSession`→`bumpGeneration()`, `logout`→`reset()`, `refreshTokens`→`controller.refresh(...)`. (in-flight 식별은 promise 동일성 대신 단조 id — self-reference 타입 에러 회피, 의미 동일.)
3. `src/auth/refreshController.test.ts` — **단위테스트 6종**: 단일비행(동시호출 1 promise·1 fetch), in-flight 해제 후 재시도, 성공/실패 generation guard, 실패 시 토큰 클리어, `reset()` 후 새 flight. `node --test`(Node 23 타입스트리핑, 설치 0) — `npm test` 스크립트 추가.
- 테스트 인프라: `tsconfig.app.json`에 `exclude: ["src/**/*.test.ts"]`(빌드 타입체크에서 테스트 제외, `@types/node` 불필요).
- App.tsx **4,607 → 4,487줄**. **게이트 4종 전부 통과: `npm test` 6/6, `tsc -b` 0 errors, `lint` 0, `build` 성공.** 동작 무변화(refresh/guard 의미 보존, 테스트로 고정).

## ✅ Phase 3b — auth 훅 분리 완료 (2026-06-19) *(컴포넌트 킷은 별도 패스)*
god-component split의 본체. 모든 회귀 민감 로직을 **순수 + 단위테스트**로 먼저 빼고, 훅은 그 위에 배선만.
1. `src/auth/authClient.ts` — auth 엔드포인트 5종 순수 래퍼(`oauthLogin`/`kakaoCodeLogin`/`devLogin`/`refreshSession`/`serverLogout`). login·bootstrap·logout·refreshTokens의 inline `request(...)` 6곳 제거.
2. `src/auth/withAuthRetry.ts` (+ `.test.ts` 6종) — `authedRequest`/`optionalAuthRequest`의 **401→refresh→retry 핸드셰이크를 순수 헬퍼로 추출**. `ApiError` 결합을 `isUnauthorized` 주입으로 끊어 fetch mock 없이 검증. required(throw)/optional(익명 폴백) 분기는 `onMissingToken`/`onRefreshExhausted` 주입으로 1:1 표현.
3. `src/auth/useAuth.ts` — auth state(`tokens`/`profile`/`authReady`/`authError`+loading/error) + `refreshController` ref + `authedRequest`/`optionalAuthRequest` + `refreshTokens` + login 3종 + `loadProfile` + **부트스트랩 effect**를 훅으로 이동. **경계**: `useAuth({ onAuthenticated, onLogout })` — 로그인 성공→`onAuthenticated`(App이 `setView("home")`), logout의 게임상태 8종 리셋+`setView("login")`는 `onLogout` 콜백(App 소유). `authedRequest` 등은 destructure로 같은 이름 유지 → **호출처 30+ 무변경**.
- App.tsx **4,487 → 4,244줄**(세션 누적 5,565→4,244, −24%). import 14개 정리(`createRefreshController`/authClient 5종/`withAuthRetry`/`request`/`getDeviceId`/`ACCESS_KEY`/`REFRESH_KEY`/`normalizeUserProfile`/`Tokens` 등).
- **게이트 전부 통과: `npm test` 12/12, `tsc -b` 0 errors, `lint` 0, `build` 성공.** tsc 0은 "App이 참조하는 모든 auth 멤버가 훅 return에 존재"를 보증(배선 누락 0). 브라우저 육안 확인만 koo `npm run dev`로 남음.

## ✅ 컴포넌트 킷 — 프리미티브 12종 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
계획 §6의 ms_* 프리미티브를 `src/components/ui/`에 **Flutter 정본에서 새로 포팅**. Phase 1 토큰(`tokens.css`) 위에 올림. auth 분해와 분리된 디자인/픽셀 패스.

- **아이콘 = `lucide-react`** (koo 확정 2026-06-19). Material 아이콘 → lucide 매핑. 5탭: home→`Home`, description→`FileText`, people→`Users`, schedule→`Clock`, star→`Star` (`case-nav-items.ts`의 `CASE_NAV_ITEMS`). lucide는 stroke 기반이라 Material과 미세하게 다름(허용된 트레이드오프). Button icon16 / TextField suffix20 / BottomNav 22 / Empty 36 — **킷이 size를 강제**(caller가 `LucideIcon` 타입만 전달, 픽셀 드리프트 차단).
- **CSS = 컴포넌트별 CSS Modules**(`X.module.css`). 글로벌 `App.css`(`.button` 등)와 스코프 충돌 0 → 전환기 공존 안전. 값은 전부 `tokens.css` `var(--*)` 소비(리터럴 0).
- **12 프리미티브 + 배럴**(`src/components/ui/index.ts`): `Button`(4 variant·press .98@dur1·icon-only·loading 스피너) · `Pill`(4 tone, r1 각짐, monoLabel 9.5) · `Kicker`(라벨+1px divider) · `StatRow`(셀 세로 구분선·tone) · `TextField`(focus 1.5px+glow, **:focus-within**로 JS 없이) · `FilterChip` · `BottomNav`(+`CASE_NAV_ITEMS`) · `Spinner` · `Skeleton`/`ListSkeleton`(shimmer 1600ms) · `Empty` · `Modal`(제어형) · `ToastProvider`/`useToast`.
- **명령형 → React 관용구 전환**: Flutter `Overlay.insert`(MSToast) → `ToastProvider` + `useToast()` 컨텍스트(4s 자동 dismiss, fade+slide). Flutter `showMSModal` → 제어형 `<Modal open onClose primaryAction secondaryAction>`(scrim/ESC 닫힘, fade+scale.98+8px up @dur3, createPortal). react-refresh 0 warn 위해 훅/컨텍스트(`toast-context.ts`)·비원시 상수(`case-nav-items.ts`)는 컴포넌트 파일과 분리.
- **중복 통합**: `FilterChip` = `filter_chip_row.dart`+`filter_chip_widget.dart`(동일) → 1개. (※ `ImageViewerModal` 통합은 **도메인 컴포넌트 패스 몫**, 아직 안 함.)
- **픽셀 정합 보존 포인트**: glow `0 0 0 3px var(--primary-28)`(blur0 spread3) · monoLabel ls 1.98px(fontSize 변경에도 절대값 유지) · Pill r1(2) · press scale .98는 **Button만**(chip/nav은 전역 `button:active` 스케일 `transform:none`로 무력화 = Flutter 동작) · 버튼 라벨 weight 600은 Pretendard 400/700 번들에서 700로 매칭(= Flutter와 동일).
- **게이트 전부 통과**: `npm test` 12/12, `npm run lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공. ⚠ **킷은 아직 어떤 화면에서도 import 안 됨**(Phase 5에서 소비) → 번들 미포함이라 `build`(esbuild)는 킷을 안 건드림. **킷 컴파일 보증 = `tsc -b 0`**(전 src 타입체크). 브라우저 육안 확인은 미완(킷 갤러리 또는 Phase 5 화면 배선 시).

## ✅ 도메인 컴포넌트 — 카드/이미지 레이어 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
계획 §6 하단 "도메인 컴포넌트"를 `src/components/domain/`에 포팅. **방침 = Flutter 픽셀 충실 + 웹 도메인 타입 props**(핸드오프 확정 "충실도=픽셀 동일, 데이터=웹 실연동"에 정합). 현재 웹의 간소화 갭(`<SafeImage>` 텍스트 폴백 등)을 정본대로 복원: **이니셜 아바타·카테고리 아이콘·NEW/해금 pill·conflict 슬롯**.

- **이미지 계열**(`AssetImage.tsx`): `AssetImage`(img + 로딩 shimmer 1400ms + 폴백, `publicImageUrl`로 http/키 해석 = Flutter `startsWith('http')` 분기) · `CharacterPortrait`(이니셜 아바타 폴백 — subject teal→sky / witness ink600→500 그라디언트, ink0 14% 보더, 이니셜 size*0.38) · `EvidenceThumb`(이미지 or 아이콘 박스 34) · `ScenarioCoverImage`(그라디언트 ink900→teal + 코드 monoNum36).
- **카드**: `EvidenceTile`(주력 — 썸네일/이름/위치 monoLabel/카테고리 뱃지/**NEW·해금 글로우 spread2 blur0**/timeLocked opacity.5+자물쇠) · `EvidenceItem`(suspect 상세 전용 — 아이콘 박스 + '확보됨', pad 13×11) · `EvidenceCategoryBadge`(bgHover r1 monoLabel 8.5) · `SuspectCard`(포트레이트 40·이름 titleM14·'증인' mute pill·심문 칩) · `TimelineList`(time 칼럼 46 + label/desc + **conflict 슬롯**).
- **이미지 뷰어**: `ImageViewerModal` — `image_viewer_modal.dart`(정본) + `image_viewer.dart`(레거시) **통합 1개**(§6 중복 통합 완료). 제어형 `<ImageViewerModal open src label onClose>` portal, scrim/ESC, contain 이미지 r6 + 로딩/에러 placeholder.
- **카테고리 매핑**(`evidence-icons.ts`): 정본 `game_session_controller.dart` → lucide — PHYSICAL→`Package`, DOCUMENT→`FileText`, DIGITAL_LOG→`Server`, TESTIMONY→`MessageSquare`, default `FileText`. + `evidenceCategoryLabel`(물적/문서/디지털/증언).
- **동작 분리**: Flutter의 `Navigator`/`GameSessionProvider` 읽기 제거 → `onPress` 콜백. 데이터는 웹 `Evidence`/`Suspect`/`TimelineEvent` 타입(필드명 다름: title/locationName/isUnlocked, portraitImageUrl). **Flutter엔 있고 웹 데이터엔 없는 필드(`isNew`·timeline `conflict`)는 옵션 prop**으로 노출 — 픽셀 충실 유지, Phase 5에서 세션 상태로 주입.
- 배럴 `src/components/domain/index.ts`. **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `build` 성공. 도메인 컴포넌트도 아직 미import(Phase 5 소비) → 번들 미포함, **`tsc -b 0`이 컴파일 보증**. 브라우저 육안 확인 미완.

### ⏭ 컴포넌트 킷에서 아직 안 한 것 (game_modals 바텀시트)
- `HintSheet`/`EvidencePresentSheet`/`CaseBriefingSheet`/`ReviewWriteSheet` — `game_modals.dart`(25KB) + `review_write_sheet.dart` 정본. 드래그 핸들(36×4)·바텀시트 진입/퇴장 모션 포함. 도메인 카드보다 동작이 복잡해 별도 배치로 남김.

## ✅ Phase 5 시작 — 모바일퍼스트 셸 + 홈 (pilot) (2026-06-19, 브랜치 `feat/react-migration-tokens`)
계획 §9 Phase 5(화면별 픽셀 정합)를 **"셸/홈"부터** 착수. koo의 *"모바일퍼스트 화면이 아니다"* 지적 → 폰 컬럼 셸 + Flutter 충실 홈을 첫 화면으로 이식. (koo가 "Phase 5 — 앱 셸 + 파일럿 화면" 명시 선택.)

- **모바일퍼스트 셸**: `App.css` `.app-frame` → `max-width:430px; margin:0 auto`(폰 컬럼, 데스크톱 중앙 정렬). `Shell`에 `bare` 추가 — 홈은 자체 헤더(ClueRoom)가 있어 topbar 제거(`bare={view==="home"}`), main 패딩 0. **다른 화면은 아직 기존 topbar 유지**(화면별 점진 이식).
- **홈 이식**(`src/components/screens/HomeScreen.tsx` + `.module.css`): 정본 `lib/screens/home_screen.dart` — 헤더(ClueRoom titleL + 프로필 아이콘 lucide `CircleUserRound`) → 16:9 웰컴 배너(ink900→teal 그라디언트, `MYSTERY LIBRARY` · '탐정 사무소' pill · titleM · subtitle · ghost CTA) → 하단 액션. **데이터/동작은 웹 보존**(koo #4): 미로그인 시 로그인 CTA, `hasSession` 시 수사 복귀, 수사 기록. (Flutter '만들기'는 웹 빌더 없어 제외, stats-grid/quick-actions 웹 장식 제거.)
- App.tsx: 옛 인라인 `HomeScreen`(hero-panel/stats-grid/quick-actions) 제거 → 새 컴포넌트 import. 호출부 `scenarioCount` prop 제거. **킷이 처음으로 실제 화면(home)에 소비됨** → 메인 번들 반영(index.js 277→282kB, css 25→29kB).
- **게이트 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` 0, `build` ok. dev 서버(5174) HMR 정상.
- **확인**: `npm run dev` → **`http://localhost:5174/`** (앱 기본 진입 view가 home, 미로그인도 렌더되어 로그인 없이 바로 보임). `#gallery`는 여전히 부품 갤러리.

## ▶ 다음 작업 (Phase 5 이어가기, §9 순서)
- **다음 화면**: §9 순서 = **라이브러리/상세** → 케이스 허브 → 증거/용의자/심문 → 제출/결과. 라이브러리(FilterChip·ScenarioCoverImage·시나리오 카드)가 도메인 킷을 많이 소비해 자연스러운 다음 타깃. 정본 `scenario_library_screen.dart` + GAMEPLAY_SPEC.
- **셸 완성도**: Flutter 앱 바텀 네비(홈/라이브러리/기록/만들기/내 정보, `app_shell.dart`)를 `view`에 매핑해 추가하면 모바일 셸 일관성↑(현재 home bare + 나머지 topbar 혼재 상태).
- **남은 부품**: game_modals 바텀시트 4종(킷 마지막 조각) / **Phase 4 기능 훅 분해**(god-state, 회귀 금지 폴링·타이머 순수추출→node:test) — Phase 5와 인터리브 가능.

## 🔎 컴포넌트 갤러리 (육안 검증용, 2026-06-19)
프리미티브 12 + 도메인 카드를 한 화면에서 픽셀 대조하려고 갤러리를 깔아둠.
- 위치: `src/components/gallery/Gallery.tsx` (+ `Gallery.module.css`). 샘플 데이터는 웹 도메인 타입.
- 접근: `npm run dev` 후 **`http://localhost:5173/#gallery`** (해시 `#gallery`). 평소 URL = 기존 앱.
- 배선: `main.tsx`가 `#gallery`일 때만 **lazy 로드**(별도 청크 `Gallery-*.js`) → **앱 번들·`App.tsx` 무영향**(메인 번들 +1.5kB만). 빌드가 갤러리 청크에서 킷/도메인/lucide를 실제로 번들 → 컴파일뿐 아니라 **번들링까지 검증됨**.
- 이미지 데모는 온라인일 때 picsum 로드, 오프라인이면 폴백(이니셜/아이콘 박스/그라디언트) 표시 — 폴백이 곧 정본 갭 복원 포인트라 그대로 확인 가능.
- 검증 후 불필요하면 `gallery/` 폴더 + `main.tsx`의 3줄(lazy/isGallery/분기)만 제거하면 원복.

## 작업 규칙
- 작업 브랜치 `feat/react-migration-tokens` 이어서 사용(또는 Phase별 분기). 커밋/푸시는 명시 요청 시에만.
- 분해(Phase 2~4)와 화면 정합(Phase 5)은 기능 단위로 인터리브 가능. 토큰(Phase 1)은 완료됨.
- 완료 주장 전 항상 `npm test && npm run lint && npx tsc -b && npm run build`로 검증. (`tsc -b`는 build가 esbuild라 타입체크를 안 하므로 필수. 현재 `tsc -b` 0 errors 상태를 유지할 것.)
