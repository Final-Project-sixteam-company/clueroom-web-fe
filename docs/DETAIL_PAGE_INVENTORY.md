# ClueRoom Web Detail Page Inventory

Last updated: 2026-06-20

이 문서는 최신 백엔드 API 문서와 React 웹 프론트 구현을 기준으로 상세 화면, 상세성 보조 화면, 남은 QA/Jira 항목을 정리한다.
외부 미니앱 패키징, miniapp-specific login, Android 단독 배포 항목은 현재 웹 배포 범위에서 제외한다.

Related visual asset: `start-up/docs/brochure-assets/clueroom_web_detail_pages_qa_board_v3.png`

## Current Detail Screens

| Screen | Status | Main component | Backend/API basis | Notes |
|---|---|---|---|---|
| Scenario detail | Implemented / QA partial | `src/components/screens/ScenarioDetailScreen.tsx` | `GET /api/scenarios/{id}`, `GET/POST /reviews`, `POST/DELETE /bookmarks` | Mobile 390px start CTA passed. Bookmark/review persistence still needs follow-up. |
| Case briefing | Implemented / QA pass | `src/components/screens/CaseBriefingScreen.tsx` | Reuses `ScenarioDetailResponse`, then `POST /api/play-sessions` | Session create/recover path passed in production smoke. |
| Case hub / scene | Implemented / QA pass | `src/components/screens/case/CaseHubScreen.tsx`, `SceneTab.tsx` | `GET /dashboard`, `GET /locations`, `GET /hints`, `POST /hints/{hintId}/use` | Briefing and hint sheets are in web scope. |
| Evidence detail | Implemented / QA pass | `src/components/screens/EvidenceDetailScreen.tsx` | `GET /api/play-sessions/{sessionId}/evidences/{evidenceId}` | Uses safe guidance fallback and image fallback. Locked evidence remains masked. |
| Suspect detail | Implemented / QA pass | `src/components/screens/SuspectDetailScreen.tsx` | `GET /api/play-sessions/{sessionId}/suspects/{suspectId}`, `GET /interrogations?suspectId=...` | Interrogate and preselect-culprit entry are wired. |
| Interrogation detail/chat | Implemented / QA pass | `src/components/screens/interrogation/InterrogationChatScreen.tsx`, `EvidencePresentSheet.tsx` | `GET/POST /api/play-sessions/{sessionId}/interrogations`, `GET /evidences?status=unlocked` | Recommended chips are prefill-only. `aiQuota.message` fallback still needs route-level verification. |
| Timeline detail view | Implemented / QA pass | `src/components/screens/case/TimelineTab.tsx` | `GET /api/play-sessions/{sessionId}/timeline` | All/contradiction/statement filters exist. No overlap observed in latest smoke. |
| Final deduction | Implemented / QA validation pass | `src/components/screens/SubmitScreen.tsx` | `POST /api/play-sessions/{sessionId}/final-deduction` | 5+ char validation, evidence chip hit target, duplicate-submit guard. Actual final submit only in QA-approved test sessions. |
| Result detail | Implemented / QA partial | `src/components/screens/ResultScreen.tsx` | `GET /api/play-sessions/{sessionId}/result` | Polling/retry/fallback states exist. Correctness/score detail was not recorded in public QA. |
| Saved cases | Implemented / QA partial | `src/components/screens/BookmarksScreen.tsx` | `GET /api/scenarios/bookmarked` | Screen entry works. Server list reflection after toggle needs follow-up. |
| Records | Implemented / QA recheck | `src/components/screens/RecordsScreen.tsx` | Records API first, local fallback second | Production records API availability still needs confirmation. |
| Profile | Implemented / QA pass | `src/components/screens/ProfileScreen.tsx` | `GET /api/auth/me`, logout endpoint | Public QA login UI must be disabled before public traffic. |

## Remove / Keep Out Of Scope

| Item | Decision |
|---|---|
| Miniapp-specific login route | Removed from current web scope. Do not expose miniapp login copy or entry points in public web. |
| External miniapp package artifacts | Removed from current web release scope. |
| Flutter-only create tab | Not part of current web nav. My-scenario tab is placeholder only. |
| Separate recommended-question API | Not used. Evidence `guidance.suggestedQuestions` drives prefill-only chips. |
| Frontend answer/culprit constants | Forbidden. Result details come only from backend result API after submission. |
| Raw secret/session/token examples | Forbidden in public docs and QA artifacts. |

## Latest QA/Jira Follow-up

| Priority | Area | Work item | Acceptance |
|---|---|---|---|
| P1 | Auth/Ops | Hide QA login entry from public production | Public `https://www.clueroom.xyz` shows only intended OAuth paths unless a restricted QA build/flag is used. |
| P2 | Bookmark | Stabilize toggle and saved-cases persistence | Add/remove stays on detail, survives refresh, and `GET /api/scenarios/bookmarked` reflects server state. |
| P2 | Review | Confirm post-review visibility | Integer 1-5 review submits and appears on detail after append or reload. |
| P2 | Auth/session | Verify OAuth access-expiry refresh retry | Expired access token retries via HttpOnly refresh cookie without localStorage refresh token. |
| P3 | Interrogation quota | Verify missing `aiQuota.message` fallback | Quota banner shows safe fallback copy and working action button when message is absent. |
| P3 | Visual QA | Keep latest tutor UI pass current | Mobile 390px and desktop smoke screenshots remain non-overlapping for detail, chat, timeline, submit. |

## Source Documents

- Backend API flow: `start-up/docs/frontend/CLUEROOM_APP_FLOW_API_GUIDE.md`
- Web migration spec: `docs/REACT_WEB_MIGRATION_GAMEPLAY_SPEC.md`
- Web porting status: `docs/PORTING_STATUS.md`
- Latest public-safe QA report: `start-up/docs/qa/archive/QA_WEB_PROD_SMOKE_REPORT_2026-06-20.md`
