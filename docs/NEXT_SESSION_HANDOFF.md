# 다음 세션 핸드오프 — ClueRoom Flutter→React 마이그레이션

> **다음 세션 시작 프롬프트(복붙용)** — 아래 코드블록을 새 Claude Code 세션(작업 디렉토리 = `clueroom-toss-miniapp`)에 그대로 붙여넣으면 돼요. 상세 진행은 이 문서 아래 ✅ 섹션들이 정본이에요.

```text
ClueRoom Flutter→React 마이그레이션을 이어서 진행합니다. 작업 디렉토리 = clueroom-toss-miniapp.

## 먼저 읽을 것 (정본)
1. docs/NEXT_SESSION_HANDOFF.md — 진행 상태·결정·다음 작업의 정본 (특히 ✅ 섹션들).
2. docs/REACT_WEB_MIGRATION_PLAN.md — 전체 계획(§9 단계 순서, §11 koo 확정값).
3. docs/REACT_WEB_MIGRATION_GAMEPLAY_SPEC.md — 게임플레이 20화면 픽셀 명세(§2 CASE SCREEN 등 = 다음 작업 레퍼런스).
4. 픽셀 정본: ../project-fe/lib/theme/*.dart, ../project-fe/lib/components/*.dart, ../project-fe/lib/screens/*.dart

## 지금까지 완료 (다시 분해하지 말 것)
- Phase 1~3b: 디자인 토큰(src/theme/tokens.css)+self-host 폰트, 순수 레이어 분해(config/env·types·lib/storage·api/*), auth 훅 분리(src/auth/* — refreshController/withAuthRetry/useAuth + node:test 12종).
- 컴포넌트 킷 12종(src/components/ui/): Button/Pill/Kicker/StatRow/TextField/FilterChip/BottomNav/Spinner/Skeleton/Empty/Modal/Toast. CSS Modules + tokens.css var, 아이콘=lucide-react.
- 도메인 카드(src/components/domain/): AssetImage·CharacterPortrait·EvidenceThumb·ScenarioCoverImage / EvidenceTile·EvidenceItem·EvidenceCategoryBadge / SuspectCard / TimelineList / ImageViewerModal + evidence-icons. Flutter 픽셀 충실 + 웹 도메인 타입 props(동작은 콜백).
- 갤러리(src/components/gallery/): npm run dev → /#gallery (부품 육안 검증, lazy 청크라 앱 번들 무영향).
- Phase 5 셸: 모바일퍼스트 셸(App.css .app-frame=430 폰 컬럼) + 하단 네비(APP_NAV_ITEMS 4탭, '만들기' 제외) + 셸 픽스 2건(topbar 패딩·전역 box-sizing). 탭 화면(home/library/records/profile)=topbar 제거+BottomNav, 비-탭=상황별 chrome.
- Phase 5 화면 이식(src/components/screens/, 각 .module.css, 파일 상단 .dart 출처 주석):
  · 홈 HomeScreen(home_screen.dart) · 라이브러리 LibraryScreen(scenario_library_screen.dart — 웹 3축 필터 조합 보존+Flutter 칩 픽셀, 검색 350ms 디바운스, 48×60 썸네일 이미지우선+그라디언트 폴백).
  · 상세 ScenarioDetailScreen(scenario_detail_{screen,widgets,cards,rating}.dart — bare+자체 AppBar(back/bookmark/more)+sticky CTA, 히어로 이미지우선+ink900→primary25 그라디언트 폴백, 4셀 메타그리드, 평점카드+리뷰+스포일러). canPlay 게이팅·북마크·리뷰 웹 동작 보존.
  · 로그인 LoginScreen(login_screen.dart — bare 전체화면, 로고 오브+환영합니다, Google=GIS 공식 버튼·Kakao=노란 #FEE500 브랜드 버튼). ⚠ Kakao 버튼은 VITE_KAKAO_JAVASCRIPT_KEY 있을 때만 노출(현재 .env.example 비어 있음 → 키 넣으면 자동 활성). Google·Kakao 동작은 Phase 3에서 이미 배선됨(리다이렉트 왕복 포함).
  · 브리핑 CaseBriefingScreen(case_briefing_screen.dart — bare+자체 AppBar+sticky footer, 5섹션 stagger 페이드인, 제목 display48/사건개요/피해자 placeholder/탐정목표 danger박스, '수사 시작하기' loading=caseLoading).
  · 케이스 허브 CaseHubScreen + 4탭(src/components/screens/case/ — case_screen.dart + scene/evidence/suspects/timeline_screen.dart). bare 탭 셸(100dvh inner-overflow): 얇은 HUD(사건코드·브리핑·타이머·해금증거) + 하단 5탭 네비(CASE_NAV_ITEMS). 제출=5번째 네비탭→submit view 푸시. 중단=back→AbandonDialog(kit Modal)→onAbandon(App `abandonSession`의 window.confirm 제거, 코어 불변). 브리핑/힌트=kit Modal 임시. 폴링·타이머는 App 소유 유지. 옛 인라인 CaseScreen 등 5함수(~514줄) 제거 → App.tsx 3162줄.
  · 심문 채팅 InterrogationChatScreen + EvidencePresentSheet(src/components/screens/interrogation/ — interrogation_chat_screen.dart 외). bare 100dvh flex: AppBar(back/이름·역할/증거제시) + 메시지(용의자·탐정 말풍선+대기, 자동 하단 스크롤) + 추천질문 칩(웹 캔드 3개) + 입력바. 증거 제시=EvidencePresentSheet 바텀시트(검색+리스트, 기능 이식). prop 계약 동일 → ChatScreen 태그명만 교체. 옛 ChatScreen/EvidencePickerDialog(~202줄) 제거 → App.tsx 2960줄. ⚠ 정본 AppBar 힌트 버튼 생략(웹 챗 hints 미전달).
  · 증거 상세 EvidenceDetailScreen + 용의자 상세 SuspectDetailScreen(src/components/screens/ — evidence_detail/suspect_detail_*.dart). bare 상세 레시피(자체 AppBar + 페이지 스크롤). 증거=히어로86/상태 Pill/관찰 정보 카드(설명·관련 용의자·타임라인·가이던스). 용의자=프로필(CharacterPortrait 80)/관계/관련 증거(EvidenceItem)/진술 카드/심문 로그 + sticky 하단 바(뒤로/심문하기/범인 지목). prop 계약 동일 → 태그명만 교체. 옛 GuidanceBlock/EvidenceDetailScreen/SuspectDetailScreen/Avatar/인라인 TimelineList 제거 → App.tsx 2537줄.
  · 제출 SubmitScreen + 결과 ResultScreen(src/components/screens/ — submit/result_*.dart). **§9 게임 흐름 전부 이식 완료.** 제출=bare(back 바)+폼(헤더/진범 select/동기·방법·은폐 TextField/증거 셀렉터/체크리스트/제출 danger) + kit Modal 확인. 결과=bare('CASE CLOSED')+등급 헤더(display96 fade-in)/매칭 카드/맞춘·놓친/해설/확인된 증거/추천 사건/3버튼. prop 계약 동일 → 태그명만 교체. 옛 인라인 5함수 제거 → App.tsx 2125줄(세션 누적 −62%).

## ⚠ 알아둘 것
- 게이트(완료 주장 전 필수): npm test && npm run lint && npx tsc -b && npm run build. tsc -b가 타입 게이트 정본(build=vite/esbuild라 타입체크 안 함). 현재 0 errors 유지.
- 테스트=node --test(Node 23 타입스트리핑, 의존성 0). tsconfig.app.json은 *.test.ts를 빌드 타입체크에서 exclude.
- 화면 이식 방침: 픽셀=Flutter 정본, 데이터/동작=웹 보존(koo 확정 #4). 컴포넌트는 프리젠테이션(웹 타입 props + 콜백). Flutter엔 있고 웹에 없는 필드는 옵션 prop.
- 셸 현황: **§9 게임 화면 전부 이식 완료**(home/library/scenarioDetail/briefing/case 허브+4탭/chat/evidenceDetail/suspectDetail/submit/result). **아직 옛 마크업(미이식)** = **records/profile/bookmarks(비-게임)만**. 비-탭 단일 화면 = 자체 AppBar + 페이지 스크롤(+sticky 하단 바 옵션). 탭/채팅 셸 = 고정 상단/하단 + 100dvh inner-overflow. 앱 탭(records/profile) = bare + APP_NAV BottomNav.
- 회귀 금지(보존): request 엔벨로프·401→refresh→retry(single-flight refreshInFlightRef + generation guard)·**30초 status-gated 폴링·1초 타이머(loadCaseRef)**·accessToken localStorage + http-only refresh 쿠키. auth는 순수헬퍼+테스트로 고정됨.
- 홈은 / (앱 기본 view, 미로그인도 렌더). 각 컴포넌트 파일 상단에 .dart 정본 출처 주석 있음 → 1:1 대조 가능.

## ▶ 다음 작업 (§9 게임 화면 ✅ 완료 — 남은 영역)
- **비-게임 옛 마크업 이식**: 기록 my_records_screen.dart(records) · 내 정보 my_page_screen.dart(profile) · 북마크(bookmarks). 앱 탭 화면(records/profile)은 bare + APP_NAV BottomNav 셸. 옛 인라인 교체.
- **game_modals 정본 픽셀화**: HintSheet/EvidencePresentSheet/CaseBriefingSheet/ReviewWriteSheet(현재 힌트/브리핑/제출확인=kit Modal 임시, EvidencePresentSheet=기능 이식 → 정본 바텀시트 드래그 핸들·모션).
- **Phase 4 기능 훅 분해**: god-state(App.tsx 2125줄) — useScenarios/useGameSession/useRecords/useResult. ⚠ 회귀 금지 폴링(30초)·1초 타이머 순수추출 → node:test.
- **Phase 6**: Splash 2.2s / Onboarding 5슬라이드(koo #5) — splash_screen.dart · onboarding_screen.dart.

## 작업 규칙
- 완료 주장 전 4 게이트. tsc -b 0 유지. 이식은 Flutter 정본과 1:1 대조 가능하게(파일 상단 .dart 출처 주석).
- 커밋/푸시는 koo 명시 요청 시에만. .omc/ 커밋 제외. 작업 브랜치 feat/react-migration-tokens(미게시). ⚠ 이번까지의 상세/로그인/브리핑 작업은 **아직 미커밋**일 수 있음 — git status 확인하고 필요 시 koo에게 커밋 여부 확인.
- 모범답안 대신 근거 기반. 불확실하면 koo에게 되묻기.
```

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

## ✅ Phase 5 — 라이브러리 화면 이식 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
§9 순서의 두 번째 화면. 정본 `lib/screens/scenario_library_screen.dart`를 `src/components/screens/LibraryScreen.tsx` + `.module.css`로 이식. 홈과 동일 레시피(새 컴포넌트 + App.tsx 호출부 교체).

- **필터 모델 결정(koo 확정 2026-06-19)**: Flutter 는 단일선택 8탭(전체/공식/커스텀/인기/최신/쉬움/보통/어려움 → 각 탭이 `ScenarioFilter` 1개로 치환, 조합 불가)이지만 웹은 `sort`+`type`+`difficulty` **3축 조합**(`buildScenarioQuery`가 셋 동시 전송). koo #4(데이터/동작=웹 보존)에 따라 **웹 3축 조합 유지 + Flutter `FilterChip` 픽셀**로 결정. 축별 칩 행(정렬/유형/난이도, 좌측 축 라벨은 웹 3축용 추가 요소) 렌더 → `인기+공식+어려움` 동시 적용 가능(웹 그대로). *Flutter 8탭 단일선택은 채택 안 함*(조합 기능 회귀 방지).
- **검색 350ms 디바운스 도입**: Flutter `_onQueryChanged`(350ms) 이식 — 기존 웹 Enter/검색버튼 → 디바운스 onChange로 교체. 입력은 로컬 state 즉시 에코, 서버 반영만 디바운스. 칩(축) 변경은 디바운스 취소+즉시 커밋하며 입력 중 검색어도 함께 보냄(Flutter `_onTabChanged`가 최신 `_query` 사용하는 것과 동일). 디바운스 클로저의 filter 캡처는 *축 변경이 항상 타이머를 취소*하므로 stale 불가(주석으로 불변식 명시).
- **카드 픽셀**(`_ScenarioRow`): bgElev·r4·line 보더, pad sp3. 48×60 썸네일 + sp3 + 신축 메타(난이도 Pill+`N분·용의자 N명`+제목 2줄 ellipsis+태그 3개 `#tag`) + sp3 + 우측 통계(★평점 primary / 플레이수 `x.xk`). 난이도 Pill tone = easy→success/normal→primary/hard→danger. `_formatPlays`(≥1000→'x.xk') 1:1 이식.
- **썸네일 갭 해소**: Flutter `_CodeThumb`는 48×60 코드 그라디언트(웹 Scenario엔 `code` 없음). 웹은 `thumbnailUrl` 보유 → **이미지 우선 + 타입별 그라디언트 폴백**(official bgHover→primarySoft / custom bgHover→successSoft), 48×60/r3/보더 프레임은 Flutter 그대로. `AssetImage`(도메인 킷) 소비.
- **상태**: loading→`ListSkeleton`(itemHeight 96), 빈 목록+에러→`Empty`(CloudOff '불러오지 못했습니다'+다시 시도), 빈 목록→`Empty`(SearchX '일치하는 사건이 없습니다'), 목록 있음+에러(추가 로드 실패)→리스트 유지+인라인 에러행(웹 동작 보존, Flutter는 무음이지만 웹은 error 세팅하므로 표시). 더보기 = `hasNext`일 때 secondary Button / `loadingMore`면 Spinner 20.
- **데이터/동작 보존**: `scenarios/filter/loading/loadingMore/hasNext/error` + `onRefresh/onLoadMore/onFilterChange/onSelect` prop 계약을 옛 인라인 `LibraryScreen`과 **동일 유지** → App.tsx 호출부(line 1238) 무변경. 서버 흐름(`loadScenarios`/`loadMoreScenarios`/`applyScenarioFilter`/페이지네이션)은 App 소유 그대로.
- App.tsx: 옛 인라인 `LibraryScreen`(113줄, `search-row`/`FilterChips`×3/`ScenarioCardList`) 제거 → 새 컴포넌트 import. (`FilterChips`·`ScenarioCardList`·`ScreenTitle`·`StateBlock`은 타 화면 공용이라 유지.) 셸은 **비-bare 유지**(topbar 네비 보존 — 바텀 네비 미구현 상태라 bare 전환 시 이탈 경로 상실 방지).
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(LibraryScreen 메인 번들 반영: css 29→38kB, js 282→292kB, lucide Search/CloudOff/SearchX 포함). 브라우저 육안 확인만 koo `npm run dev` → `/` 진입 후 '사건' 탭으로 남음.

## ✅ Phase 5 — 모바일 셸 정합: 셸 픽스 2건 + 앱 하단 네비 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
라이브러리(첫 비-home 화면)를 데스크톱에서 띄우자 Phase 5 셸 변경(앱프레임 430) 이후 잠복하던 레이아웃 버그 2건이 드러나 함께 해소. + Flutter 앱 셸 하단 네비 이식으로 모바일 셸 완성. (koo 육안 확인 → "ship".)

- **셸 픽스 ①: topbar 오버플로**(`App.css`) — `.topbar` 패딩이 옛 full-width 정렬 공식 `max(20px, calc((100vw - 1180px)/2 + 20px))`을 쓰고 있었음. `100vw`(전체 뷰포트) 기준이라 430 프레임 안에서 좌우 ~430px 패딩 → topbar 콘텐츠 우측 오버플로("CR사건ueRoom" 충돌) + 가로 스크롤로 `margin:0 auto` 중앙정렬까지 깨짐. → `padding: 8px 20px`로 단순화. home은 bare(topbar 없음)라 Phase 5 때 안 드러났던 것.
- **셸 픽스 ②: 전역 box-sizing 부재**(`index.css`) — 전역 `border-box` 리셋이 *없어서*(킷/도메인 모듈 16종 + App.css 5곳이 제각각 선언) `main { width:100% } + content-box padding 20` = 470px가 430 프레임을 40px 삐져나감. → `*,*::before,*::after { box-sizing: border-box }` 정본화. `main`은 `width: min(100%,1180px)` 잔재도 `width:100%`로 정리. 라이브러리뿐 아니라 profile·records·detail 등 동일 잠복결함 일괄 해소.
- **앱 하단 네비**(정본 `app_shell.dart`): `src/components/ui/app-nav-items.ts`(`APP_NAV_ITEMS`, 배럴 export) — **4탭(홈/라이브러리/기록/내 정보)**. Flutter 5탭 중 **'만들기'(빌더)는 웹에 빌더 없어 제외**(koo 확정, 홈 이식 때 제외와 일관). 아이콘 lucide 매핑(Home/Library/ClipboardList/User). 게임 내 `CASE_NAV_ITEMS`(현장/증거/용의자/타임라인/제출)와 별개.
- **Shell `nav` 모드**(`App.tsx`): 탭 화면(home/library/records/profile)은 `navIndex`로 판별 → **topbar 제거 + `BottomNav` 표시**. 비-탭 화면(login/scenarioDetail/bookmarks/case/evidence/suspect/chat/submit/result)은 `navIndex===-1` → **기존 topbar 유지 + 네비 미표시**(Flutter push 라우트와 동일). 레이아웃 = Flutter `Scaffold`: `.app-frame--tabbed`가 `100dvh` 고정, `main`만 스크롤(`flex:1; overflow-y:auto`), 네비 바닥 고정(콘텐츠가 네비 뒤로 안 넘어감). 탭 탭은 기존 진입점 그대로(홈/라이브러리=`setView`, 기록=`tokens?records:login`, 내 정보=`openProfile` 자체 게이팅) → 동작 보존.
- **셸 현황 갱신**: 이제 탭 화면 4종은 bare+하단네비, 비-탭은 topbar. (이전의 "home bare + 나머지 topbar 혼재" 해소.) 탭 화면 내부의 옛 백버튼(records "내 정보로 돌아가기" 등)은 하단 네비와 약간 중복 — 화면별 이식 시 정리 권장.
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(BottomNav+APP_NAV_ITEMS+lucide 4종 메인 번들 반영, 갤러리 청크는 중복 제거로 축소).

## ✅ Phase 5 — 시나리오 상세 화면 이식 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
§9 순서의 세 번째 화면. 정본 `scenario_detail_{screen,widgets,cards,rating}.dart` 4종을 `src/components/screens/ScenarioDetailScreen.tsx`(+ `.module.css`)로 이식. 라이브러리/홈과 동일 레시피(새 컴포넌트 + App.tsx 호출부 교체). 호출부 prop 계약(scenario/bookmarked/reviews/loading/error + onBack/onStart/onToggleBookmark/onWriteReview/onOpenImage)을 옛 인라인과 **동일 유지** → App.tsx 호출부(1286~) 무변경.

- **자체 chrome 로 전환(bare)**: 상세는 비-탭 화면 — 이번에 **`bare={view==="scenarioDetail"}`** 추가로 셸 topbar 제거하고 **자체 AppBar**(arrow_back / bookmark / more_vert) 소유(Flutter 투명 AppBar 정본). 레이아웃 = Flutter Scaffold: `.screen`을 `min-height:100dvh` flex 컬럼으로 세우고 **AppBar/CTA 를 `position:sticky`**(top/bottom)로 뷰포트 고정 → 비-탭 bare 프레임(`.app-frame`은 페이지 스크롤)의 vh/dvh 더블스크롤 회피. (탭 셸의 `--tabbed`와 달리 inner overflow 안 씀 — bare 프레임은 페이지가 스크롤 컨테이너.)
- **히어로 = 로컬 구성(ScenarioCoverImage 재사용 안 함)**: 핸드오프 권고는 도메인 `ScenarioCoverImage` 소비였지만, 그 폴백 그라디언트는 **ink900→teal**인데 상세 정본 `ScenarioHeroArt`는 **ink900→primary(25%)** + 코드 monoNum36 primary30%로 **다른 그라디언트**. 정본 충실 위해 히어로는 화면 모듈에서 직접 구성 — **이미지 우선(`AssetImage` src=thumbnailUrl, 웹 동작: 탭→이미지 뷰어) + Flutter 그라디언트 폴백**. (라이브러리 썸네일과 같은 "이미지 우선+폴백" 화합.)
- **본문(ScenarioMetaGrid/Synopsis/Tags/Reviews)**: 타입 배지(공식=danger Pill, OFFICIAL일 때만)+난이도 Pill(easy→success/normal→primary/hard→danger) → titleL 제목 → 코드 monoLabel → **4셀 메타 그리드**(난이도/플레이시간/용의자/증거, 0이면 '—', 셀 사이 세로 구분선, 값 monoNum14) → 시놉시스(Kicker '시놉시스 · SYNOPSIS', body lh1.7) → 태그(Kicker '태그', #tag rPill, 웹 tags 있을 때만) → 평점·리뷰(Kicker '평점 · REVIEWS' + **ScenarioRatingCard**[점수 monoNum40 w700 + `x.xk플레이` + 5행 분포 막대] + 리뷰 카드들 + '리뷰 작성하기' secondary 버튼).
- **리뷰 카드/스포일러**: bgElev·r4, 작성자 body w600 + ★평점 monoLabel primary + `M.D` monoLabel textMute. 스포일러는 `스포일러 포함 — 탭하면 공개`(dangerSoft 박스, TriangleAlert) → 탭 시 본문 공개(웹 ReviewCard 동작 보존).
- **하단 CTA(ScenarioBottomCta)**: `canPlay===false`면 준비중 경고 박스(Construction 아이콘, `{code} 시나리오는 아직 준비 중입니다.`) + [북마크 아이콘버튼(primary/secondary)] [수사 시작/준비 중(Play/Lock, 불가 시 disabled)]. **canPlay 게이팅은 웹 동작 보존**(`!== false`만 가능). 시작 → `onStart`(briefing). 북마크 토글은 AppBar·CTA 양쪽(Flutter 정본).
- **데이터/동작 보존**: `toggleScenarioBookmark`·`loadScenarioReviews`·`addScenarioReview`(리뷰 작성은 `onWriteReview`→App `ReviewDialog`, Flutter ReviewWriteSheet 바텀시트는 game_modals 패스 몫)·`canPlay`·이미지 뷰어 모두 App 소유 콜백 그대로.
- **옛 인라인 제거**: App.tsx 옛 `ScenarioDetailScreen`/`ScenarioReviews`/`ReviewCard` 3함수(약 186줄) 삭제 → 새 컴포넌트 import. (`ReviewDialog`·`SafeImage`·`Stat`·`InfoPanel` 등 공용은 유지.) App.tsx **3935줄**로 감소.
- **koo 확인 필요(의도적 선택, 한 줄로 뒤집기 쉬움)**: ① 시작 버튼 라벨을 Flutter "조사 시작" 대신 앱 전반 어휘 "수사 시작"으로 통일(브리핑/홈과 일관). ② Flutter엔 없는 웹 "제작자(author)" 패널은 정본 레이아웃에 없어 미표시(데이터는 보존). ③ Flutter "{subtitle} · {code}" → 웹은 subtitle 없어 코드(`CL-NNN`)만. ④ more_vert 는 Flutter처럼 무동작 placeholder. ⑤ sticky CTA 분리용 하어라인(`--line-soft`) 1개 추가(Flutter엔 없는 웹 보조).
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(상세 화면 메인 번들 반영: css 38→45.9kB, js 292→301.8kB; lucide ArrowLeft/Bookmark/MoreVertical/Construction/Play/Lock/SquarePen/TriangleAlert 포함). 브라우저 육안 확인만 koo `npm run dev` → 라이브러리 카드 탭 진입으로 남음.

## ✅ Phase 5 — 로그인 화면 이식 + Google/Kakao 버튼 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
koo 지적("배포앱 https://www.clueroom.xyz 로그인에 Google·Kakao 세팅됨 → 맞춰야 함")으로 우선 착수. **핵심 사실**: Google·Kakao 로그인 **동작은 Phase 3에서 이미 100% 배선돼 있었음**(리다이렉트 왕복 포함) — 안 보였던 이유는 **env 키 게이팅**(`ENABLE_*`)이지 미구현이 아님. 정본 `login_screen.dart`를 `src/components/screens/LoginScreen.tsx`(+ `.module.css`)로 이식하며 옛 마크업 → Flutter 픽셀 + 브랜드 버튼으로 전환.

- **koo 확정(2026-06-19, AskUserQuestion)**: ① 버튼 비주얼 = **배포앱 매칭(브랜드)** — Google=GIS 공식 버튼, Kakao=노란 #FEE500 브랜드 버튼. (Flutter 의 동일 secondary 2버튼 대신 채택. 웹 Google 은 GIS 제약상 공식 위젯이 강제 — 임의 버튼으로 idToken 수신 불가.) ② Kakao 키 = **플래그 뒤에 빌드** — 버튼/동작 만들되 `ENABLE_KAKAO_LOGIN`(=`VITE_KAKAO_JAVASCRIPT_KEY` 존재 시)일 때만 노출, 키 없으면 자동 숨김(레포에 비밀값 없음, 키 넣으면 자동 활성).
- **레이아웃(정본)**: 80×80 로고 오브(bgElev, primary60% 1.5px 보더, **primary18% blur24 spread4 글로우** — 이 화면만 blur 있는 진짜 그림자) "CR" titleM primary ls2 → sp8 → '환영합니다' titleL 28 → sp2 → 서브타이틀 body lh1.5 → 48 → (dev/qa 게이트) → '또는' divider(dev+provider 둘 다 있을 때만) → Google(GIS) → sp4 → Kakao. 페이지 padding h32 v48 + top 40. **셸 bare 추가**(`view==="login"`) — 전체화면(Flutter 풀 Scaffold, 앱바 없음).
- **동작 보존(전부 그대로)**: Google GIS `renderButton`(filled_blue/continue_with) → `onGoogleCredential(idToken)` → `oauthLogin(GOOGLE)`. Kakao 노란 버튼 → `ensureKakaoInitialized` → `Auth.authorize({redirectUri, state})` → 돌아올 때 `useAuth.ts`가 URL `code`+`state===KAKAO_LOGIN_STATE` 읽어 `kakaoCodeLogin` → `/api/auth/oauth/kakao/code`. dev/qa = `onDevLogin`. GoogleSignInButton/KakaoSignInButton 은 App.tsx → LoginScreen 파일로 이동(로그인 전용).
- **App.tsx 정리**: 옛 `LoginScreen`/`GoogleSignInButton`/`KakaoSignInButton` 3함수(약 205줄) 삭제 → 새 컴포넌트 import. 로그인 전용 import 11개 정리(env 8: GOOGLE_CLIENT_ID/ENABLE_GOOGLE_LOGIN/ENABLE_KAKAO_LOGIN/ENABLE_DEV_LOGIN/DEFAULT_QA_LOGIN_EMAIL/QA_LOGIN_NICKNAME/ENABLE_QA_LOGIN/KAKAO_LOGIN_STATE + sdkLoaders 3: loadGoogleIdentityScript/ensureKakaoInitialized/kakaoRedirectUri). 호출부 prop 계약 동일 → JSX 무변경. App.tsx **3730줄**.
- **Kakao 심볼**: lucide 에 없어 인라인 SVG 말풍선(브랜드 마크 근사, currentColor=ink0 85%). 버튼 r3/h48/label14·700 = MSButton 정합, press scale .98.
- **⚠ koo 액션 필요(블로커는 아님)**: Kakao 버튼이 실제로 뜨려면 **`VITE_KAKAO_JAVASCRIPT_KEY`(공개 JS 키, Kakao Developers 앱 키)** 가 `.env` 에 있어야 함. `.env.example` 에 자리+주석 추가(콘솔 Web 플랫폼에 origin/Redirect URI 등록 안내 포함). Google ID 는 `.env.example` 에 이미 채워져 있음. *로컬에서 보려면 `.env` 생성 필요*(레포엔 `.env` 없음).
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(로그인 메인 번들 반영: css 45.9→48.95kB, js 301.8→302.24kB). 브라우저 육안 확인만 남음(`.env` 세팅 후 `npm run dev` → 미로그인 시 `/` 가 login).

## ✅ Phase 5 — 케이스 브리핑 화면 이식 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
§9 순서의 네 번째 화면. 정본 `case_briefing_screen.dart`를 `src/components/screens/CaseBriefingScreen.tsx`(+ `.module.css`)로 이식. 상세에서 '수사 시작' → `briefing` view 진입(이미 배선).

- **레이아웃 = 상세 bare 레시피 재사용**: `bare={view==="briefing"}` 추가, 자체 AppBar(back + 'CASE BRIEFING' monoLabel) + 100dvh flex + **sticky AppBar/footer**(페이지 스크롤). 본문(가로 sp4): [0] 제목 **display(48)** → [1] 사건 개요(Kicker '사건 개요' + synopsis body lh1.6) → [2] 피해자 정보(_VictimRow) → [3] 탐정 목표(dangerSoft 박스, 3줄 목표 body w600 danger lh1.8) → [4] 하단 '수사 시작하기' 버튼(sticky footer). 섹션 간 sp6.
- **진입 스태거 모션**: Flutter `_playSequential`의 순차 await(`80*i` 누적) → 누적 시작시각 **[0,80,240,480,800]ms**, 각 dur3(320ms) easeOut, fade+slide-up(y10→0) 재현. `prefers-reduced-motion: reduce` 시 애니메이션 off.
- **_VictimRow = 세션 전 placeholder(정본)**: 피해자 상세는 세션 시작 후 `dashboard.briefing` 으로만 와서, 브리핑에선 정본대로 40×40 그라디언트(ink700→ink500) 아바타 '?' + '미상' + '피해자 정보는 수사 시작 후 공개됩니다'(스포일러 방지) + 위치 pill(`scenario.tags[0] ?? '현장'`, dangerSoft/monoLabel). 하드코딩 안 함.
- **동작 보존**: '수사 시작하기' → `onStart`(App.`startSession`). startSession 은 비동기(성공 시 `setView("case")`, 실패 시 브리핑 잔류)라 버튼 로딩은 **`loading={caseLoading}`** prop 으로 표현(Flutter `_starting` 대응 — 실패 시 caseLoading=false 로 자동 복구). 호출부에 loading prop 한 줄만 추가.
- **탐정 목표 카피**: Flutter 하드코딩 정본 그대로("1.진범 / 2.살해 방법·동기 / 3.증거 확보"). 옛 웹 카피("인물을 심문하고…")는 정본으로 교체. 옛 인라인 `CaseBriefingScreen`(48줄) 제거 → 새 컴포넌트. App.tsx **3671줄**.
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(브리핑 메인 번들 반영: css 48.95→52.09kB, js 302.24→303.67kB). 브라우저 육안 확인만 남음.

## ✅ Phase 5 — 케이스 허브(메인 탭 셸) + 4탭 전부 이식 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
§9 순서의 다섯 번째 화면(가장 큰 조각). 정본 `case_screen.dart` 셸 + 4개 탭 화면(`scene/evidence/suspects/timeline_screen.dart`)을 `src/components/screens/case/` 하위 5컴포넌트로 이식. koo 확정(2026-06-19): **풀 허브(셸+4탭 전부)** + **브리핑 버튼 = kit Modal 임시**.

- **신규 파일(각 `.module.css` + 파일 상단 `.dart` 출처 주석)**: `CaseHubScreen`(셸) · `SceneTab` · `EvidenceTab` · `SuspectsTab` · `TimelineTab`. App.tsx 호출부는 prop 계약 동일 유지 → `<CaseScreen>` → `<CaseHubScreen>` 태그명만 교체(JSX 무변경).
- **셸 레이아웃 = 탭 셸 모델(inner-overflow)**: 상세/브리핑(페이지 스크롤+sticky)과 달리 하단 네비가 있어 **`100dvh` 고정 프레임 + body 만 내부 스크롤**(`.app-frame--tabbed` 와 동일 원리, 단 화면 자체 소유). `bare={view==="case"}` 추가(앱 topbar/앱네비 제거) → 화면이 HUD(상단)·CASE_NAV(하단)를 자체 소유.
- **HUD(정본 _buildHud, 높이 sp10)**: 사건코드 `CL-NNN`(dashboard.scenarioId 0패딩, 폴백 CL-001) + 브리핑 버튼(ClipboardList 20 primary) + 타이머(Timer 14 + monoNum 13) + 해금증거(FileText, `n/m`, >0 success). `formatTime`(normalizers) 소비. **dashboard==null 로딩/실패/종결은 본문만 교체(HUD·네비 상시)**: 로딩=Spinner28, 실패=Empty(CloudOff)+재시도/나가기, 종결=Empty(Gavel)+결과 보기(정답 누출 가드).
- **하단 5탭 네비 = `CASE_NAV_ITEMS`**(현장/증거/용의자/타임라인/제출). **제출(4) → `onSubmit`(App.setView "submit") 푸시**(웹 동작 보존, view enum). 0~3 은 `caseTab` 전환. 폴링/타이머는 App 소유 그대로 — 화면은 dashboard/콜백 props 만 소비(회귀 0).
- **탭별 이식**: 현장=서브헤더(CRIME SCENE+힌트 lightbulb, 고정) + 맵 4:3(AssetImage/플레이스홀더, 탭→이미지뷰어) + 장소 리스트(_LocationCard 선택 애니 dur2, '해금 n/m' 필) + 선택 장소 이미지(160+그라디언트). 증거=검색+필터칩(전체/확보됨/잠긴 증거)+Kicker+`EvidenceTile` 리스트(고정 헤더+스크롤). 용의자=검색+칩(전체/용의자/증인)+`StatRow`(용의자/증인/심문)+`SuspectCard`. 타임라인=서브헤더+칩(전체/⚠모순/용의자주장)+도메인 `TimelineList`. 도메인/킷 컴포넌트 **처음으로 게임 화면에서 실소비**.
- **중단 플로우(koo 확정 = back+AbandonDialog kit Modal)**: HUD 좌상단 back(정본 HUD엔 없으나 view-enum 웹은 이탈 경로 필요) → AbandonDialog(kit Modal, 계속수사/나가기) → `onAbandon`. **App `abandonSession` 의 `window.confirm` 제거**(확인은 화면 Modal이 소유) — abandon **요청·상태리셋 코어는 불변**(회귀 보호 목록 밖). abandonSession 호출처는 이 case 하나뿐 확인 후 변경.
- **옛 인라인 제거**: `CaseScreen`/`LocationPanel`/`HintPanel`/`EvidenceList`/`SuspectList` 5함수(약 514줄) 삭제 + 고아 `formatTime` import 제거. (인라인 `TimelineList` 는 증거 상세서 재사용 → 유지. `Stat`/`InfoPanel`/`FilterChips` 타 화면 공용 → 유지.) App.tsx **3676 → 3162줄**.
- **⚠ koo 확인 필요(의도적 선택, 한 줄로 뒤집기 쉬움)**: ① **잠긴 증거 = `EvidenceTile isTimeLocked`(opacity+자물쇠+비활성, 정본 픽셀) + 제목 '잠긴 증거' 마스킹**(스포일러 보존) — 기존 웹은 잠긴 카드 탭 가능(상세서 해금 힌트)이었으나 비활성으로 바뀜(픽셀 vs 동작 충돌, 픽셀 우선). ② **힌트 = lightbulb → kit Modal 임시**(브리핑과 동일 방침, 정본 HintSheet 미이식). ③ **현장 맵 마커 미표시**(정본 `scene_screen._SceneMap`엔 장소 마커 없음 — 해금 수는 장소 카드 필로 노출, 정보 손실 0). ④ 브리핑/힌트 Modal 은 `secondaryAction={null}` + 확인 단일 버튼(임시).
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(허브+4탭 메인 번들 반영: css 52.09→66.78kB, js 303.67→322.13kB; lucide ArrowLeft/ClipboardList/Timer/FileText/CloudOff/Gavel/Lightbulb/Map/MapPin/Image/Search/SearchX/UserX/Clock/CircleAlert 등 포함). 브라우저 육안 확인만 koo `npm run dev` → 브리핑 '수사 시작' 진입으로 남음.

## ✅ Phase 5 — 심문 채팅(InterrogationChat) 이식 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
§9 순서의 여섯 번째 화면(가장 큰 조각). 정본 `interrogation_chat_screen.dart`(+ `interrogation_{app_bar,bubbles,input_bar,suggested_questions,waiting_bubble,actions_mixin}.dart`)를 `src/components/screens/interrogation/` 2컴포넌트로 이식. 옛 인라인 `ChatScreen`/`EvidencePickerDialog` 교체.

- **신규 파일(각 `.module.css` + 상단 `.dart` 출처 주석)**: `InterrogationChatScreen`(화면) · `EvidencePresentSheet`(증거 제시 바텀시트). App.tsx 호출부 prop 계약 **동일** → `<ChatScreen>` → `<InterrogationChatScreen>` 태그명만 교체(JSX·배선 무변경). `bare={view==="chat"}` 추가.
- **레이아웃 = 100dvh flex 컬럼**: AppBar(고정) + 메시지 리스트(스크롤, 새 메시지 시 하단 자동 스크롤=정본 scrollToBottom 프리젠테이션) + 추천 질문 칩 바(고정) + 입력 바(고정). 채팅 셸도 허브와 같은 inner-overflow 모델.
- **말풍선(정본 bubbles)**: 용의자=24 teal→sky 그라디언트 아바타(이니셜) + bgElev 말풍선(좌상 r1, 나머지 r4). 탐정=우측 정렬 primarySoft 말풍선(우상 r1); 증거 제시 시 successSoft + 'FileText 증거 제시' 태그 + 본문색 text. 대기=bgHover 아바타(스피너) + bgElev 말풍선(스피너).
- **입력 바(정본 input_bar)**: pendingEvidence 있으면 '증거 연동됨: {title}' 칩(successSoft + Link2 + 해제) / 없으면 '증거 제시' secondary 버튼(FileText). + 입력(TextField, maxLength 500) + 전송(아이콘 전용 Send primary, loading 시 disabled).
- **증거 제시(EvidencePresentSheet)**: 정본 game_modal `showEvidencePresentModal` 바텀시트의 **기능 이식** — 드래그 핸들 + 검색 + 보유 증거 리스트(EvidenceThumb 40 + 제목 + 위치·카테고리), 슬라이드업 + scrim 닫힘. AppBar 액션·입력 바 버튼 양쪽서 오픈. **웹 EvidencePickerDialog 동작/검색 보존**.
- **회귀 0**: 컨트롤드 컴포넌트 — messages/question/pendingEvidence/`sendQuestion`(401·AI 60초 타임아웃·증거 해금 등)은 App 소유 그대로, 화면은 props/콜백만. 옛 인라인 `ChatScreen`+`EvidencePickerDialog`(약 202줄) 제거 → App.tsx **3162 → 2960줄**(세션 누적 5,565→2,960, −47%).
- **⚠ koo 확인 필요(의도적 선택, 한 줄로 뒤집기 쉬움)**: ① **추천 질문 = 웹 캔드 3개**(하드코딩)를 Flutter SuggestedQuestionsBar 픽셀로 렌더(정본은 동적 guidance·하드코딩 금지지만 웹 챗 계약엔 미전달 → 웹 동작 보존). chip tap=prefill only. ② **정본 AppBar 힌트 버튼 생략**(웹 챗 계약에 hints 미전달 — 현장 탭서 힌트 접근 가능, 추후 HintSheet 와 함께 추가 가능). ③ **EvidencePresentSheet 는 기능 이식**(드래그 제스처/퇴장 모션 생략) — game_modals 슬라이스에서 정본 픽셀로 교체.
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(메인 번들 반영: css 66.78→73.61kB, js 322.13→326.18kB; lucide ArrowLeft/FileText/Send/Link2/X/Search/SearchX 포함). 브라우저 육안 확인만 koo `npm run dev` → 용의자/증거 상세에서 심문 진입으로 남음.

## ✅ Phase 5 — 증거 상세 + 용의자 상세 이식 완료 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
§9 게임 화면 중 상세 2종. 정본 `evidence_detail_screen.dart`(+ widgets/meta) / `suspect_detail_screen.dart`(+ bottom_bar/cards/widgets, GAMEPLAY_SPEC §6~7·§10)를 `src/components/screens/` 2컴포넌트로 이식. 옛 인라인 `EvidenceDetailScreen`/`GuidanceBlock`/`SuspectDetailScreen` 교체. 둘 다 bare 상세 레시피(자체 AppBar + 페이지 스크롤).

- **EvidenceDetailScreen**: AppBar('EVIDENCE') + 히어로 86(teal→sky 그라디언트 폴백, 탭→이미지뷰어) + 제목/위치(중앙) + 상태 Pill(확보됨/잠김) + 관찰 정보 카드(설명 + 관련 용의자 Pill + 관련 타임라인 EvidenceTimelineRow + 가이던스: 볼 점·함께 볼 증거·추천 질문). prop 계약 동일.
- **SuspectDetailScreen**: AppBar(WITNESS/SUSPECT) + 프로필(CharacterPortrait 80·이름·역할·증인 Pill·성격 뱃지) + 피해자와의 관계 + 관련 증거(EvidenceItem) + 진술 카드(진술/알리바이/공개 알리바이) + 이전 심문 로그 카드 + **sticky 하단 바(뒤로/심문하기/범인 지목)**. prop 계약 동일.
- **회귀 0 + 정리**: 컨트롤드 — 상세 fetch·로그·culprit 선택은 App 소유 콜백 그대로. 옛 인라인 5함수(`GuidanceBlock`/`EvidenceDetailScreen`/`SuspectDetailScreen`/`Avatar`/인라인 `TimelineList`) + 고아 `Guidance` import 제거 → App.tsx **2960 → 2537줄**(세션 누적 5,565→2,537, **−54%**). 도메인 EvidenceItem/CharacterPortrait/AssetImage 게임 상세서 실소비.
- **⚠ koo 확인(한 줄로 뒤집기 쉬움)**: ① **증거 상세 '증거 제시' 용의자 섹션**은 웹 전용(정본 detail 엔 없음 — 정본은 onPresent CTA). 정본 CTA(onInterrogate/onPresent)는 웹 계약에 없어 생략, 웹의 chip→onChat 동작 보존. ② **용의자 범인 지목** = 정본은 AccuseDialog 확인 후 SubmitScreen인데 웹은 onSelectCulprit 직행(웹 동작 보존, 라벨만 '범인 지목'). ③ 용의자 아바타 탭→뷰어는 웹 계약에 onOpenImage 미전달이라 생략. ④ 관련 증거는 웹 동작대로 탭→상세 진입(정본은 no-op).
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(메인 번들 css 73.61→82.34kB, js 326.18→330.71kB; lucide ArrowLeft/Search/Lock/HelpCircle/ChevronRight/FileText 포함). 브라우저 육안 확인만 koo `npm run dev` → 증거/용의자 탭 카드 탭으로 남음.

## ✅ Phase 5 — 제출 + 결과 이식 완료 = §9 게임 화면 전부 완료 🎉 (2026-06-19, 브랜치 `feat/react-migration-tokens`)
§9 마지막 두 게임 화면. 정본 `submit_screen.dart`(+ widgets/evidence_selector) / `result_screen.dart`(+ widgets/cards)를 `src/components/screens/` 2컴포넌트로 이식. 옛 인라인 `SubmitScreen`/`SubmitChecklist`/`SubmitConfirmDialog`/`ResultScreen`/`ResultMatchRow` 교체. **이로써 §9 게임 흐름(홈→라이브러리→상세→브리핑→케이스 허브+4탭→심문→증거/용의자 상세→제출→결과) 전부 이식 완료.**

- **SubmitScreen**: bare(얇은 back 바) + 페이지 스크롤. SubmitHeader(경고 48 danger + 'titleL + 안내) + 1.진범 지목(styled native select) + 2.동기/방법/은폐(TextField rows3) + 3.제출 증거 셀렉터(선택 Pill + check 행, 15개 상한) + 체크리스트(미충족 시) + 제출(danger). 제출 → kit Modal 확인 → onSubmit. prop 계약 동일. canSubmit/MIN_DEDUCTION_TEXT_LENGTH 웹 그대로.
- **ResultScreen**: bare AppBar('CASE CLOSED') + 등급 헤더(display96, S/A=success, fade-in) + 채점 매칭 카드(5행 정답/오답) + 맞춘/놓친 추리 + 사건 해설 카드(진범 danger + 피드백/해설) + 확인된 증거 Pill + 다음 추천 사건(웹 전용) + 3버튼(다른 사건/리뷰/홈). result prop 만 렌더(폴링은 App 소유).
- **회귀 0 + 정리**: 컨트롤드 — 폼 상태·submitDeduction·result 폴링은 App 소유 그대로. 옛 인라인 5함수 제거 → App.tsx **2537 → 2125줄**(세션 누적 5,565→2,125, **−62%**).
- **⚠ koo 확인**: ① 정본 4번 '종합 추리 설명(선택)' summary 생략(웹 계약에 없음). ② 제출 체크리스트는 정본대로 미충족 시에만 노출(웹은 항상). ③ 결과 버튼 = 정본 단일('홈으로')과 달리 웹 3버튼 보존. ④ '다음 추천 사건'은 웹 전용(정본 result 엔 없음).
- **게이트 전부 통과**: `npm test` 12/12, `lint` 0, `npx tsc -b` **0 errors**, `npm run build` 성공(메인 번들 css 82.34→90.93kB, js 330.71→336.43kB; lucide TriangleAlert/CircleCheck/Circle/CircleX/FileQuestion 포함). 브라우저 육안 확인만 koo `npm run dev` → 허브 제출탭/용의자 범인지목 → 제출 → 결과로 남음.

## ▶ 다음 작업 (§9 게임 화면 완료 — 남은 영역)
게임 흐름은 전부 이식됐고, 남은 건 **비-게임 화면 + 부품 폴리시 + 분해 + Phase 6**:
- **비-게임 옛 마크업 이식**: 기록 `my_records_screen.dart`(records) · 내 정보 `my_page_screen.dart`(profile) · 북마크(bookmarks). 앱 탭 화면(records/profile)은 허브가 아닌 **앱 BottomNav** 셸 — 탭 화면 레시피(bare + BottomNav). 옛 인라인 교체.
- **game_modals 정본 픽셀화**: HintSheet/EvidencePresentSheet/CaseBriefingSheet/ReviewWriteSheet — 현재 힌트/브리핑=kit Modal 임시, 제출 확인도 kit Modal, EvidencePresentSheet=기능 이식 → 정본 바텀시트 픽셀(드래그 핸들·진입/퇴장 모션)로 교체.
- **Phase 4 기능 훅 분해**: god-state(App.tsx 2125줄, 아직 큼) — useScenarios/useGameSession/useRecords/useResult. 회귀 금지 폴링(30초)·1초 타이머 순수추출 → node:test.
- **Phase 6**: Splash 2.2s 모션 / Onboarding 5슬라이드(koo #5, 둘 다 픽셀 복원). `splash_screen.dart` · `onboarding_screen.dart`.
- **확립된 레시피**: bare 단일 화면 = 자체 AppBar + 페이지 스크롤(+sticky 하단 바 옵션). 탭 셸 = 고정 상단/하단 + 100dvh inner-overflow(허브/심문). 앱 탭(records/profile) = bare + APP_NAV BottomNav.

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
