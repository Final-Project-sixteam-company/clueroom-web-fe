# ClueRoom React Web Porting Status

Last updated: 2026-06-20

이 문서는 Flutter Android 앱 UX를 React/Vite 웹으로 이식한 현재 상태를 정리합니다.
Apps in Toss 패키징과 Toss 로그인은 현재 범위에서 제외되었습니다.

## Implemented

- React/Vite/TypeScript web app scaffold
- Dark ClueRoom visual style and Flutter-inspired component tokens
- Google OAuth via Google Identity Services
- Kakao authorization-code login via Kakao JavaScript SDK and backend code exchange
- HttpOnly refresh cookie compatible auth flow
- 401 refresh single-flight and retry
- QA login entry for controlled QA builds
- Scenario library
- Scenario keyword search and sort/type/difficulty filters
- Scenario detail
- Server-backed scenario bookmarks
- Server-backed scenario reviews with spoiler masking
- Integer 1-5 review rating input
- Case briefing before session start
- Active session lookup before create
- Create-session 409 active-session fallback
- Active session recovery from records
- Case scene tab
- Dashboard briefing
- Location board
- Scene map image with location markers
- Location detail image viewer
- Hints list and use-hint action
- Evidence list
- Evidence search and unlocked/locked filter
- Evidence detail
- Evidence guidance reading points
- Locked compare evidence masking
- Suggested question prefill navigation
- Suspect list
- Suspect search and suspect/witness filter
- Suspect detail
- Suspect interrogation logs
- Interrogation chat
- AI quota guidance banner and recommended action routing
- Searchable evidence-present picker in interrogation chat
- Evidence-presented question send
- Recommended question prefill-only behavior
- Final deduction submit
- Final deduction checklist and confirmation dialog
- Duplicate/final-submitted result recovery
- Result polling and retry state
- Result screen neutral empty state
- Session abandon
- My page/profile screen
- Server-first investigation records with local fallback
- Server-backed bookmarked scenario screen
- Scenario/evidence image full-screen viewer
- Result scoring detail cards
- Result recommendation card rendering when backend provides data
- Post-result review entry point
- Accessibility focus states, ARIA pressed states, and meaningful image alt text

## Backend Contracts To Preserve

- `POST /api/auth/oauth`
- `POST /api/auth/oauth/kakao/code`
- `POST /api/auth/refresh` with HttpOnly refresh cookie
- `GET /api/auth/me`
- `GET /api/scenarios`
- `GET /api/scenarios/{id}`
- `GET /api/scenarios/bookmarked`
- `POST|DELETE /api/scenarios/{id}/bookmarks`
- `GET|POST /api/scenarios/{id}/reviews`
- `GET /api/play-sessions/active`
- `POST /api/play-sessions`
- `GET /api/play-sessions/{id}/dashboard`
- `GET /api/play-sessions/{id}/evidences`
- `GET /api/play-sessions/{id}/suspects`
- `GET /api/play-sessions/{id}/timeline`
- `GET /api/play-sessions/{id}/locations`
- `GET /api/play-sessions/{id}/hints`
- `POST /api/play-sessions/{id}/hints/{hintId}/use`
- `GET|POST /api/play-sessions/{id}/interrogations`
- `POST /api/play-sessions/{id}/final-deduction`
- `GET /api/play-sessions/{id}/result`

## Still To Recheck

- Visual QA against latest tutor UI pass
- Mobile scenario detail CTA regression on 390px viewport
- Real Google and Kakao OAuth smoke after every production deploy
- QA login disabled again before public traffic
- Web records API availability in production; local fallback must remain non-primary

## Build

```bash
npm test
npm run lint
npx tsc -b
npm run build
```

Deploy static web assets with:

```bash
bash scripts/deploy-web.sh
```
