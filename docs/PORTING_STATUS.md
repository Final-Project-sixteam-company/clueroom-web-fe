# ClueRoom Apps in Toss Porting Status

Last updated: 2026-06-16

## Implemented

- Apps in Toss Web Framework project scaffold
- `.ait` build
- ClueRoom app icon and dark investigation visual style
- Toss login frontend call with `appLogin()`
- `/api/auth/toss` request wiring
- local token storage through Apps in Toss `Storage`
- startup refresh
- protected API 401 refresh and retry
- scenario library
- scenario detail
- case briefing before session start
- active session lookup before create
- create-session 409 active-session fallback
- case scene tab
- dashboard briefing
- location board
- hints list and use-hint action
- evidence list
- evidence detail
- evidence guidance reading points
- locked compare evidence masking
- suggested question prefill navigation
- suspect list
- suspect detail
- suspect interrogation logs
- interrogation chat
- evidence-presented question send
- recommended question prefill-only behavior
- final deduction submit
- duplicate/final-submitted result recovery
- result polling
- result screen neutral empty state
- session abandon

## Waiting On Backend

- `POST /api/auth/toss`
- Toss `authorizationCode` exchange
- Toss `login-me` userKey lookup
- TOSS provider user mapping
- ClueRoom JWT issuance for Toss login
- production CORS check for Apps in Toss WebView

## Still To Port Or Recheck

- actual Apps in Toss sandbox/device login E2E
- scenario review/write UI
- my page/profile/records
- image full-screen viewer
- richer location map interaction
- result recommendation cards
- store review policy copy and game rating metadata
- accessibility pass
- visual QA against Flutter screens

## Build

```bash
npm run lint
npm run build
```

Upload `clueroom-toss-miniapp.ait` to Apps in Toss, not an Android `.aab`.
