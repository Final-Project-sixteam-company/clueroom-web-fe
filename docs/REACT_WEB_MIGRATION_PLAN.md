# ClueRoom — Flutter → React 웹앱 마이그레이션 계획

> 작성일: 2026-06-19
> 소스(정본): `../project-fe` (Flutter 앱 `clueroom`, Dart 91파일, **다크 전용**)
> 타깃: `clueroom-web-fe` (= npm `clueroom-web`, React 19 + Vite 6 + TS)
> 결정(2026-06-19, koo):
> 1. **방식 = 현재 앱 리팩터링** — 모놀리식 `App.tsx`(5,565줄)를 Flutter 구조에 맞춰 모듈화 + 갭 보강
> 2. **충실도 = 픽셀까지 완전 동일** — 색·간격·폰트·반경·모션을 Flutter와 1:1

---

## 0. 한눈에 보는 현황

| 항목 | 소스 `project-fe` (Flutter) | 타깃 `clueroom-web` (React) |
|---|---|---|
| 구조 | 계층형 91파일 (core/api, repositories, controllers, services, screens, components, theme) | **단일 파일** `src/App.tsx` 5,565줄 + `src/App.css` 1,656줄 |
| 기능 포팅 | 원본 | **거의 전부 완료** (라이브러리·상세·케이스 허브·증거·용의자·심문·최종추리·결과·기록 등) |
| 테마 | 다크 고정 (`themeMode: ThemeMode.dark`) | 다크 (동일 의도) |
| 인증 | 네이티브 google_sign_in / kakao_flutter_sdk / flutter_secure_storage / Firebase FCM | Google GIS · Kakao JS code flow · http-only refresh 쿠키 · dev/QA 로그인 (**의도적으로 웹용으로 갈라짐**) |
| 서버통신 | `ApiClient` + `{success,data,error}` 엔벨로프 | 동일 엔벨로프를 `request<T>()`가 이미 재현 |

> **결론:** "처음부터 이식"이 아니라 **이미 동작하는 모놀리식을 (A) 구조 분해하고 (B) 픽셀 정합**하는 작업이에요. 두 축은 독립적이지만 토큰이 둘 다의 토대라서 **토큰을 먼저** 잡습니다.

---

## 1. 목표 · 비목표

**목표**
- (축 A) `App.tsx` 모놀리식을 Flutter `lib/` 레이아웃을 미러링하는 모듈 구조로 분해 — *리뷰 시 Flutter 파일과 1:1 대조 가능하게*
- (축 B) Flutter 다크 화면과 **픽셀·모션 파리티** (색/간격/반경/타이포/애니메이션)
- 이미 검증된 서버통신·웹 인증 동작을 **회귀 없이 보존**

**비목표 (이번 범위 밖)**
- FCM 푸시 알림 (웹 네이티브 불가 — §8 참조, 별도 결정 사안)
- 시나리오 제작(만들기) — Flutter도 placeholder
- 백엔드 계약 변경
- 라이트 테마 (Flutter도 런타임 미사용)

---

## 2. 작업의 두 축

```
축 A: 구조 리팩터링        축 B: 픽셀 파리티
(모놀리식 → 모듈)          (디자인 토큰 정합)
        \                    /
         \                  /
          토큰 시스템(§4)이 둘의 공통 토대
          → Phase 1에서 가장 먼저 만든다
```

순서 원칙: **토큰 확정 → 순수 레이어 분해 → 컴포넌트 킷 → 화면별 정합 → 갭 보강 → 비주얼 QA**. 토큰 없이 화면을 손대면 같은 값을 또 흩뿌리게 되고, 구조 없이 화면을 손대면 5,565줄 안에서 충돌해요.

---

## 3. 타깃 모듈 구조 (Flutter ↔ React 매핑)

웹 모놀리식 리더가 라인 범위까지 분해 지점을 짚어줬어요. 아래는 Flutter `lib/`와 1:1로 맞춘 목표 레이아웃이에요.

| React (목표) | 대응 Flutter | 분해 출처 (App.tsx 라인) |
|---|---|---|
| `src/config/env.ts` | `core/api/api_config.dart` + `core/oauth/oauth_config.dart` | 1–32 |
| `src/types/` (도메인 타입) | `models/*.dart` | 34–320 |
| `src/lib/storage.ts` (`safeGet/Set`, `getDeviceId`, `delay`) | `core/device/device_id_provider.dart` | 333–370 |
| `src/api/ApiError.ts` + `src/api/request.ts` | `core/api/{api_client,api_exception}.dart` | 322–331, 452–526 |
| `src/api/normalizers.ts` (≈18개 normalize/format) | repository 내 `_fromJson` 매퍼들 | 528–1147 |
| `src/auth/useAuth.ts` + `authClient.ts` + `sdkLoaders.ts` | `services/auth_service.dart` + main.dart SDK init | 372–449, 1342–1800 |
| `src/features/scenarios/` (hook + Library/Bookmarks/Detail/Reviews) | `repositories/scenario_repository.dart` + scenario 화면들 | ~state + 3332–3834 |
| `src/features/case/` (`useGameSession` + Case 허브·증거·용의자·힌트) | `controllers/game_session_*` + `repositories/play_session_repository.dart` + case/scene/evidence/suspect 화면 | ~state + 3835–4750, 5368–5430 |
| `src/features/interrogation/` (Chat + EvidencePicker) | interrogation_*.dart | 2205–2297, 4751–4951 |
| `src/features/result/` (Submit/Result) | submit_*, result_* | 2299–2427, 4952–5367 |
| `src/features/records/` (Home/Profile/Records) | home/my_page/my_records 화면 | 1387–1639, 3030–3331 |
| `src/components/ui/` (ms_* 킷) | `components/ms_*` + `components/states.dart` | 2765–2823, 5431–5563 |
| `src/theme/tokens.css` + `theme.ts` | `theme/app_*.dart` | App.css 분리 |
| `src/App.tsx` (얇은 셸) | `screens/app_shell.dart` + `main.dart` | ~150줄 목표 |

> **god-component 주의:** 현재 `App()`은 ~55개 `useState`를 들고 자식에 prop-drilling 해요. 분해의 핵심은 이를 **기능별 커스텀 훅**(`useAuth`/`useScenarios`/`useGameSession`/`useRecords`/`useResult`)으로 쪼개고, `App.tsx`는 `view` 스위치만 남기는 거예요.

---

## 4. 디자인 토큰 시스템 — 픽셀 파리티의 토대 (축 B 핵심)

### 4.1 현재 웹의 토큰 갭 (CSS 분석 결과)

| 갭 | 현재 웹 | Flutter 정본 | 영향 |
|---|---|---|---|
| **CSS 변수** | **0개** — 모든 값이 리터럴로 중복 | `app_tokens.dart` 토큰 체계 | 체계적 대조·교정 불가 → 변수화가 선행 조건 |
| **Pretendard** | 폰트 스택에 이름만, **실제 로드 안 됨** → OS 산세리프로 폴백 | Pretendard 400/700 번들 | **가장 큰 텍스트 렌더링 갭** |
| **JetBrains Mono** | 미로드 추정 | `monoLabel`/`monoNum` 전용 (코드·타이머·숫자·kicker) | 모노 라벨/숫자 전부 어긋남 |
| **폰트 weight** | 800/900 다수 | Pretendard는 **400/700만 번들**, mono는 600 | 웹이 더 두꺼움 → 700/600으로 교정 필요 |
| **간격** | 3/9/11/13/18px 등 "불규칙" | 4px 그리드 + **컴포넌트 전용 토큰** | ⚠ 아래 주의 |

> ⚠ **교차검증 인사이트:** 웹 CSS 리더는 Flutter 토큰을 못 봐서 웹 간격을 "불규칙"이라 판단했지만, 실제로 Flutter도 컴포넌트 전용 토큰을 써요 — `evidencePadH=13`, `evidencePadV=11`, `conflictPadH=9`, `pillPadH=7`, `chipPadH=10`. 즉 웹의 13/11/9px는 **이미 Flutter와 맞을 가능성이 큼**. 작업은 "정규화"가 아니라 **토큰 표 대조**예요.

### 4.2 만들 토큰 (`src/theme/tokens.css` → `:root` CSS 변수)

**컬러 (다크 스킴, `context.c`)** — 웹 현재 hex와 이미 대부분 일치 확인됨

| 토큰 | 값 | 웹 일치 |
|---|---|---|
| `--bg` | `#0F172A` (ink900) | ✅ app-frame |
| `--bg-elev` | `#1E293B` (ink800) | ✅ 카드/패널 |
| `--bg-hover` | `#334155` (ink700) | ✅ |
| `--line` | `#334155` (ink700) | ✅ 기본 보더 |
| `--line-soft` | `#243044` | ✅ topbar 보더 |
| `--text` | `#F1F5F9` (ink100) | ✅ |
| `--text-sub` | `#94A3B8` (ink400) | ✅ |
| `--text-mute` | `#475569` (ink600) | ✅ |
| `--primary` | `#38BDF8` (skyBase) | ✅ |
| `--primary-ink` | `#7DD3FC` (skyLight) | ✅ 버튼 fg/링크 |
| `--primary-soft` | `rgba(56,189,248,0.149)` (0x26) | ⚠ 웹은 .08~.6 다단계 alpha → 토큰화 필요 |
| `--success` | `#14B8A6` (tealLight) | ✅ |
| `--success-soft` | `rgba(20,184,166,0.149)` | |
| `--danger` | `#F43F5E` (roseBase) | ✅ (#fb7185는 roseLight) |
| `--danger-soft` | `rgba(244,63,94,0.149)` | |
| `--scrim` | `rgba(15,23,42,0.698)` (0xB2) | |
| `--shadow-card` | `rgba(8,15,30,0.40)` (0x66) | |
| 브랜드 raw | gold `#F59E0B`, tealBase `#0D9488`, ink950 `#080F1E`, ink50 `#F8FAFC` | ✅ map marker/hero gradient |

**간격 (4px 그리드)** `--sp1:4 … --sp16:64`, `--row-gap:6`, 컴포넌트 전용 `--chip-pad-h:10 / --chip-pad-v:5`, `--pill-pad-h:7 / --pill-pad-v:3`, `--evidence-pad-h:13 / --evidence-pad-v:11`, `--card-pad-h:16 / --card-pad-v:12`, `--btn-h:48`, `--nav-icon:22`, `--nav-label-fs:11`, `--thumb:34`, `--timeline-col-w:46`, `--conflict-pad-h:9`, 드래그핸들 36×4.

**반경** `--r1:2 --r2:4 --r3:8 --r4:10 --r5:12 --r6:14 --r7:20 --r-pill:999`.

**타이포 (Pretendard / JetBrains Mono)**

| 스타일 | 폰트 | size / weight / 기타 |
|---|---|---|
| display | Pretendard | 48 / 700 / letter-spacing −1.2 |
| titleL | Pretendard | 24 / 700 / −0.36 |
| titleM | Pretendard | 18 / 700 / −0.18 |
| body | Pretendard | 14 / 400 / line-height 1.6 |
| bodySm | Pretendard | 13 / 400 / 1.55 |
| caption | Pretendard | 11.5 / 400 |
| monoLabel | JetBrains Mono | 11 / 600 / letter-spacing +1.98, **대문자 변환** |
| monoNum | JetBrains Mono | 18 / 600 / `font-variant-numeric: tabular-nums` |

폰트 사이즈 스케일도 토큰화: `--fs-xxs:10 … --fs-hero:28 … --fs-d3:96`(결과 등급), 줄높이 `--lh-body:1.55 --lh-label:1.0`.

**모션** `--dur1:120ms --dur2:200ms --dur3:320ms`, `--ease-out:cubic-bezier(0.22,0.61,0.36,1.0)`, `--ease-in-out:cubic-bezier(0.65,0,0.35,1.0)`.

### 4.3 ⚠ 픽셀 파리티 특이점 (놓치면 티 나는 것들)

- **"glow" 그림자는 blur 0 + spread** — Flutter의 포커스링/NEW 하이라이트는 `blurRadius:0, spreadRadius:3` 인 **선명한 halo**예요. CSS는 `box-shadow: 0 0 0 3px var(--primary-28)` 처럼 blur 0으로. 흐린 그림자로 만들면 다른 느낌이 나요. (`MSTextField` 포커스, `EvidenceTile` NEW, `EvidenceItem` isNew)
- **press 애니메이션** `transform: scale(0.98)` over `--dur1` (`MSButton`).
- **`*Soft` = 브랜드색 15% alpha** (0x26 ≈ 0.149). 단, 배너/배경엔 6~28% 등 다른 단계도 등장 → 단계별 토큰 정의.
- **모노 라벨은 항상 대문자 + 양수 letter-spacing(1.98)**. `text-transform: uppercase`.

---

## 5. 서버통신 계층 (축 A — 이미 동작, 구조만 추출 + 정밀 정합)

`request<T>()`가 이미 Flutter `ApiClient`를 잘 재현하고 있어요. 분해 + 아래 **정합 포인트**만 챙기면 돼요.

### 5.1 엔벨로프 / 에러 (보존)
- 응답 `{success, data, error}` → success면 `data` 언랩, 실패면 `ApiError{code,message,status,details}` throw.
- 클라이언트 에러코드: `NETWORK_ERROR` / `TIMEOUT` / `PARSE_ERROR` / `AUTH_REQUIRED(401)`.
- 타임아웃: 기본 20s, **AI 엔드포인트(`/interrogations`, `/final-deduction`)는 60s**.
- base URL: `VITE_API_BASE_URL` (prod 기본 `https://api.clueroom.xyz`).

### 5.2 인증/리프레시 (보존 + Flutter 대비 정밀 정합)
- 401 → refresh → 1회 재시도, **single-flight**(`refreshInFlightRef`) + **generation guard**(`authGenerationRef`)로 로그아웃 후 stale resolve가 새 세션을 덮지 않게. *이 두 패턴은 분해 시 가장 깨지기 쉬움 → 추출 후 단위테스트.*
- 토큰 저장: **accessToken만 localStorage + http-only refresh 쿠키**(`credentials:'include'`). *Flutter의 secure-storage 양토큰 방식과 의도적으로 다름 — 웹은 이 방식이 정답이므로 유지.*
- 정합 보강(선택): Flutter의 **NO_AUTH_PATHS allow-list**(`/api/auth/{signup,login,oauth,refresh,logout,dev}`에 Bearer 미부착)와 **pre-flight refresh**(토큰 없으면 보호 호출 전에 미리 refresh)를 웹에도 명시화하면 동작이 더 정확해져요.
- `deviceId`: per-install UUID, dev/oauth/refresh 바디에 동봉.

### 5.3 엔드포인트 인벤토리 (분해 시 repository 단위로 묶기)

- **auth** (`src/auth/authClient.ts`): `POST /api/auth/oauth`(Google), `/api/auth/oauth/kakao/code`, `/api/auth/dev`, `/api/auth/refresh`, `/api/auth/logout`, `GET /api/auth/me`
- **scenarios** (`src/features/scenarios/api.ts` ↔ `scenario_repository.dart`): `GET /api/scenarios`(keyword/type/difficulty/sort/page/size), `GET /api/scenarios/{id}`, `/api/scenarios/bookmarked`, `POST|DELETE /api/scenarios/{id}/bookmarks`, `GET|POST /api/scenarios/{id}/reviews`
- **play-session** (`src/features/case/api.ts` ↔ `play_session_repository.dart`): `records`, `active`, `POST /api/play-sessions`, `{id}/dashboard|evidences|suspects|timeline|locations|hints`, `POST {id}/abandon`, `{id}/evidences/{eid}`, `POST {id}/hints/{hid}/use`, `GET|POST {id}/interrogations`, `GET {id}/result`, `POST {id}/final-deduction`

> 세션 상태머신(`game_session_controller`)의 핵심: 저장된 sessionId resume → 없으면 `GET active` → 없으면 create. 409 `SESSION_ALREADY_EXISTS`는 `details.activeSessionId`로 복구. `abandon` 시 `P003`(추리 진행 중)은 세션 유지. **30초 status-gated 폴링**(status==='PLAYING'일 때만 dashboard+evidences 재조회)이 유일한 폴링이에요(웹소켓/푸시 없음).
> 결과 폴링: 최대 5회 × 3초, 404/202는 "채점 미완"으로 재시도.

---

## 6. 컴포넌트 킷 (ms_* → React)

Flutter `components/`의 13개 `ms_*` 프리미티브가 디자인 시스템이에요. 이걸 `src/components/ui/`로 **가장 먼저** 포팅하면 모든 화면이 그 위에 올라가요.

| 컴포넌트 | 핵심 픽셀 노트 |
|---|---|
| `Button` (ms_button) | h48, r3, press scale .98@dur1, disabled opacity .42. variants: primary(bg primary/fg primaryInk)·secondary(투명+1px line)·ghost(투명/fg textSub)·danger(bg danger/fg white). label 14/600/ls−0.05, icon 16/gap 6, spinner 18/stroke 2, icon-only=48×48 |
| `Pill` (ms_pill) | pad 7×3, **r1(2, 각짐)**, 1px border, monoLabel **9.5**/대문자/lh1.0. tones primary/success/danger/mute |
| `Kicker` (ms_kicker) | 대문자 monoLabel textMute + gap8 + 남은폭 1px divider |
| `StatRow` (ms_stat_row) | bg, 1px line, r3, 셀별 1px 세로 구분선, 라벨 monoLabel 9 / 값 monoNum 15(tone neutral/good/warn) |
| `TextField` (ms_text_field) | bg, r3, 1px line→focus 1.5px primary + **glow box-shadow primary@28% spread3 blur0** @dur2, pad L12/TB9, suffix 20 |
| `BottomNav` (ms_bottom_nav) | 5탭 고정, 외곽 pad16h/8v, 내부 컨테이너 1px line r4 pad4h/6v, 아이콘 22, 라벨 caption 10/500, active primary |
| `FilterChip` (filter_chip ×2 **중복**) | pad 10×5, r-pill, AnimatedContainer@dur2, active primarySoft+primary. **두 파일 통합 → 1개** |
| `Toast` (overlays) | bottom40, tone soft bg + base border, 8px dot, bodySm, 4s 자동 fade+slide |
| `Modal` (showMSModal) | scrim barrier, fade+scale(.98→1)+8px up @dur3, card maxW360 pad24 bgElev r6, 이중 그림자 |
| `Skeleton`/`ListSkeleton` | shimmer 1600ms, bgElev→bgHover→bgElev, item h76 r4 sep12 |
| `Spinner` (ms_spinner) | stroke2, size14, primary |
| `Empty` (ms_empty) | icon36 textMute, gap16 titleM, gap8 bodySm subtitle, action/secondaryAction 버튼 |

**도메인 컴포넌트** (킷 위에, 기능별로): `AssetImage`/`CharacterPortrait`/`EvidenceThumb`/`ScenarioCoverImage`, `EvidenceTile`/`EvidenceItem`/`EvidenceCategoryBadge`, `SuspectCard`, `TimelineList`, `ImageViewerModal`, 그리고 game_modals 시트들(`HintSheet`/`EvidencePresentSheet`/`CaseBriefingSheet`/`ReviewWriteSheet`).

> **중복 통합 (마이그레이션 해저드):**
> 1. `MSFilterChip` — `filter_chip_row.dart` + `filter_chip_widget.dart` (사실상 동일) → React `<FilterChip>` 1개
> 2. `ImageViewerModal` — `image_viewer_modal.dart`(정본) + `image_viewer.dart`(레거시 트윈 + 미사용 `IconThumb`) → 1개
> 3. `EvidenceTile`(주력) vs `EvidenceItem`(suspect 상세 전용) — 둘 다 필요하지만 역할 구분

---

## 7. 화면 인벤토리 & 갭

| Flutter 화면 | 웹 view | 상태 | 갭 / 메모 |
|---|---|---|---|
| splash_screen | (StateBlock) | **단순화됨** | Flutter는 2.2s 애니 로고(CR crosshair badge, radial gradient, pulsing label). 픽셀 파리티하려면 스플래시 모션 복원 |
| onboarding_screen | — | **미구현** | 5슬라이드 캐러셀 + dot indicator. 웹에 없음 → 추가 필요 |
| login_screen | login | 구현 | Google/Kakao(웹 SDK) + dev/QA. CR 로고 배지 80×80 |
| app_shell | (view enum) | 구현(차이) | Flutter는 5탭 IndexedStack(상태 보존). 웹은 flat view 스위치 → 탭 상태보존 동작 확인 |
| home_screen | home | 구현 | 16:9 hero gradient ink900→tealBase, MSPill, ghost CTA |
| scenario_library | library | 구현 | 8필터칩, 디바운스350ms, 48×60 코드썸네일, 무한스크롤 |
| scenario_detail | scenarioDetail | 구현 | hero 16:9, 4셀 메타그리드, 평점 히스토그램(웹/Flutter 모두 하드코딩 비율), 스포일러 reveal |
| (bookmarks) | bookmarks | **웹 추가** | Flutter엔 전용 화면 없음 — 유지 |
| case_briefing | briefing | 구현 | 세션 시작 전 브리핑 |
| case_screen(+scene/evidence/suspects/timeline) | case | 구현 | 탭 허브 + dashboard HUD(타이머) + HintPanel |
| evidence_detail | evidenceDetail | 구현 | GuidanceBlock(reading points/compare/suggested Q), 잠금 마스킹 |
| suspect_detail | suspectDetail | 구현 | 프로필 + 심문 로그 + accuse |
| interrogation_chat | chat | 구현 | 말풍선, 추천질문 prefill, 증거 첨부 picker |
| **timeline_screen** | (case 탭) | **확인 필요** | Flutter도 backend timeline 미연동(sample fallback). 웹은 `/timeline` 호출 존재 — 동작 검증 |
| submit_screen | submit | 구현 | 진범+증거(1~15)+동기/방법/은폐(min5자), 체크리스트+확인 다이얼로그 |
| result_screen | result | 구현 | 등급 헤더(display 96), 매칭카드, 맞춘/놓친, 해설, 핵심증거, 추천 시나리오 |
| my_records | records | 구현(차이) | Flutter는 **정적 sample 데이터**. 웹은 server-or-local 이중 소스(개선됨) |
| my_page | profile | 구현(차이) | Flutter 프로필 하드코딩. 웹은 `/api/auth/me` 연동(개선됨) |

> **정적 데이터 주의:** Flutter의 records/profile/리뷰/평점 히스토그램/탐정등급은 상당수 **sample 하드코딩**이에요. 웹은 일부를 실제 API로 이미 올렸어요(records, profile). "픽셀 동일"을 추구할 때 *어느 쪽 데이터 동작을 정본으로 둘지*는 화면별로 §11에서 확인 필요해요.

---

## 8. 리스크 & 웹에서 "그대로"가 불가능한 것

**픽셀 파리티 리스크**
- 폰트 미로드(Pretendard/JetBrains Mono) → 로드 전엔 어떤 정합도 무의미. **Phase 1 최우선**.
- weight 800/900(웹) vs 400/700/600(Flutter) — 전역 교정.
- glow 그림자(blur0+spread)를 흐린 그림자로 잘못 구현.
- rgba(primary, X) 다단계 alpha의 토큰 누락.
- **뷰포트 기준 불일치**: Flutter는 폰 캔버스(단일 폭), 웹은 가변 + 데스크톱 프레임(max 1180px). "픽셀 동일"의 *기준 폭*을 정해야 비교가 성립 → §11.

**서버통신 리스크 (회귀 방지)**
- refresh single-flight + generation guard, 30초 status-gated 폴링, 1초 타이머(`loadCaseRef` 간접참조) — 분해 시 깨지기 쉬움 → 추출 후 테스트.

**웹에서 네이티브와 동일 불가 (대응 방식)**
- **FCM 푸시**: Flutter는 부팅 시 `/api/device-tokens` 등록. 웹은 Firebase JS SDK + service worker + VAPID로 *대체는 가능하나 동일하진 않음* → 별도 범위 결정(§11).
- **네이티브 SDK 로그인**: 이미 GIS/Kakao JS로 대체 완료 — 추가 작업 없음.
- **Hero/Navigator 전환 애니메이션**: Flutter Hero(suspect portrait 등)·라우트 전환은 웹에서 동일 재현 어려움 → 유사 트랜지션으로 근사.

---

## 9. 단계별 실행 순서

| Phase | 내용 | 산출물 / 게이트 |
|---|---|---|
| **0. 베이스라인** | Flutter 다크 화면 **레퍼런스 스크린샷** 캡처(기준 폭 확정), 토큰 표 최종화 | 비교 기준 세트, `tokens.css` 초안 |
| **1. 토큰 시스템** | `tokens.css` CSS 변수 전체 + **Pretendard/JetBrains Mono 로드** + weight 교정 + glow/모션 변수 | App.css가 변수 참조로 전환, 텍스트 렌더링 갭 해소 |
| **2. 순수 레이어 분해** | `config/env`, `types/`, `lib/storage`, `api/{ApiError,request,normalizers}` 추출 (프레임워크 무관 — 가장 안전한 첫 분해) | 빌드 통과, 동작 무변화 |
| **3. 인증 + 컴포넌트 킷** | `useAuth`/`authClient`/`sdkLoaders` 추출 + `components/ui/` ms_* 13종 포팅(+중복 통합) | refresh race 단위테스트, 킷 스토리 확인 |
| **4. 기능 훅 분해** | `useScenarios`/`useGameSession`/`useRecords`/`useResult`로 god-state 분리, `App.tsx`는 view 스위치만 | 화면별 회귀 없음 |
| **5. 화면별 픽셀 정합** | 셸/홈 → 라이브러리/상세 → 케이스 허브 → 증거/용의자/심문 → 제출/결과 순으로 스크린샷 대조·교정 | 화면별 비주얼 diff 통과 |
| **6. 갭 보강** | Onboarding 추가, Splash 모션 복원, Timeline 동작 검증 | 인벤토리 100% |
| **7. 비주얼 QA + 회귀** | 전 화면 Flutter 대비 diff, 서버통신 E2E, `npm run lint && npm run build` | 릴리스 게이트 |

> 분해(2~4)와 정합(5)은 **화면 단위로 인터리브** 가능해요 — 한 기능을 추출하면서 동시에 그 화면을 픽셀 정합하면 컨텍스트 전환이 줄어요. 단 **토큰(Phase1)은 반드시 선행**.

---

## 10. 검증 전략

- **픽셀**: Phase 0 레퍼런스 vs 구현 스크린샷 비교(기준 폭에서). 핵심은 토큰 일치 → 화면 일치 순.
- **서버통신 회귀**: 기존 동작이 정본이므로 *바꾸지 않았음*을 보장 — 로그인/세션 생성·복구/심문/최종추리/결과 폴링 E2E 스모크(`docs/RELEASE_CHECKLIST.md`의 백엔드 게이트 재사용).
- **단위테스트**: refresh single-flight, generation guard, 30초 폴링 게이팅, 1초 타이머 — 분해로 깨지기 쉬운 4개.
- **정적검사**: `npm run lint`, `npm run build`(타입 포함).

---

## 11. koo 확정 (2026-06-19 답변 완료)

> 아래는 모두 koo 확정값이에요. **다시 묻지 말 것.**

1. **픽셀 "동일"의 기준 뷰포트** → ✅ **모바일 390px 우선 + 데스크톱 반응형 유지(둘 다)**. 픽셀 1:1 정합은 모바일 390 폭에서 잡고, 데스크톱은 기존 반응형 그리드(760/1040 브레이크포인트, max 1180)를 유지·보강. 비주얼 diff 기준 폭 = 390.
2. **라우팅** → ✅ **현재 `view` enum 스위치 유지**. react-router 미도입. App.tsx는 `view` 스위치만 남기고 기능 훅으로 분해(상태머신 보존 → 회귀 최소).
3. **FCM 웹 푸시** → ⏸ **이번 마이그레이션 범위에서 제외(보류)**. §1 비목표·§8 리스크대로 별도 결정 사안. 필요 시 추후 서비스워커+VAPID로 별도 트랙.
4. **정적 데이터 화면(records/profile/리뷰·평점)** → ✅ **웹 실연동 유지가 정본**. Flutter sample 하드코딩 모양으로 되돌리지 않음. 픽셀 정합은 *레이아웃*만 맞추고 데이터 소스는 현 웹 동작 보존.
5. **Splash/Onboarding** → ✅ **둘 다 픽셀 복원(Phase 6)**. Splash 2.2s 모션(CR crosshair 배지·radial gradient·pulsing label) + 5슬라이드 Onboarding 캐러셀(dot indicator) 재현.

---

## 부록: 분석 산출물

이 계획은 양 코드베이스 병렬 정밀 분석(디자인 토큰·셸/게임플레이 화면·데이터 계층·컴포넌트 킷·웹 모놀리식 구조·웹 CSS) 결과를 종합한 거예요. Flutter 토큰/컴포넌트의 정확한 픽셀 값은 `../project-fe/lib/theme/`, `../project-fe/lib/components/`가 정본이고, 웹 분해 라인 맵은 `src/App.tsx` 기준이에요.

- **게임플레이 화면 픽셀 명세(20개 화면)**: [REACT_WEB_MIGRATION_GAMEPLAY_SPEC.md](REACT_WEB_MIGRATION_GAMEPLAY_SPEC.md) — 사건 브리핑·케이스/현장·증거·용의자·심문·타임라인·제출·결과 화면의 위젯 트리·토큰·API·모션 상세. **Phase 5(화면별 픽셀 정합)의 실행 레퍼런스**예요.
- 셸/인증/라이브러리 화면 명세, 데이터 계층 계약, ms_* 컴포넌트 픽셀 노트는 본 문서 §3~§7에 종합돼 있어요.
