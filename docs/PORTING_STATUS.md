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
- scenario keyword search and sort/type/difficulty filters
- scenario detail
- local scenario bookmarks
- local scenario reviews with spoiler masking
- case briefing before session start
- active session lookup before create
- create-session 409 active-session fallback
- active session recovery from local in-progress records
- case scene tab
- dashboard briefing
- location board
- scene map image with location markers
- location detail image viewer
- hints list and use-hint action
- evidence list
- evidence search and unlocked/locked filter
- evidence detail
- evidence guidance reading points
- locked compare evidence masking
- suggested question prefill navigation
- suspect list
- suspect search and suspect/witness filter
- suspect detail
- suspect interrogation logs
- interrogation chat
- searchable evidence-present picker in interrogation chat
- evidence-presented question send
- recommended question prefill-only behavior
- final deduction submit
- final deduction checklist and confirmation dialog
- duplicate/final-submitted result recovery
- result polling
- result screen neutral empty state
- session abandon
- my page/profile screen
- local investigation records screen
- scenario/evidence image full-screen viewer
- result scoring detail cards
- result recommendation card rendering when backend provides data
- post-result local review entry point
- release checklist for Apps in Toss and Google Play artifact split
- accessibility focus states, ARIA pressed states, and meaningful image alt text

## Waiting On Backend

- `POST /api/auth/toss`
- Toss `authorizationCode` exchange
- Toss `login-me` userKey lookup
- TOSS provider user mapping
- ClueRoom JWT issuance for Toss login
- production CORS check for Apps in Toss WebView
- production `/api/auth/me` response smoke from Toss-issued JWT

## Still To Port Or Recheck

- actual Apps in Toss sandbox/device login E2E
- backend-backed scenario review API if the product requires shared reviews
- backend-backed records API if the product requires cross-device history
- final store review metadata entry in external consoles
- screen-reader QA in actual Toss WebView
- visual QA against Flutter screens

## Build

```bash
npm run lint
npm run build
```

Upload `clueroom-toss-miniapp.ait` to Apps in Toss, not an Android `.aab`.
