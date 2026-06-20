# ClueRoom Web Release Checklist

Last updated: 2026-06-20

이 문서는 `https://www.clueroom.xyz` 일반 브라우저 웹 배포 기준 체크리스트입니다.
외부 미니앱 패키징과 miniapp-specific login 경로는 폐기되었습니다.

## Build Gate

로컬 PC Git Bash에서 실행합니다.

```bash
cd /c/java/assignment/spring/clueroom-web-fe

npm ci
npm test
npm run lint
npx tsc -b
npm run build
```

`npm test`는 `src/**/*.test.ts`의 node:test 회귀 테스트를 실제로 실행해야 합니다.
0 tests로 끝나면 배포하지 않습니다.

## Environment Gate

`.env.production` 또는 shell env에 아래 값이 들어 있어야 합니다.

```bash
VITE_API_BASE_URL=https://api.clueroom.xyz
VITE_GOOGLE_CLIENT_ID=<Google Web OAuth client id>
VITE_KAKAO_JAVASCRIPT_KEY=<Kakao JavaScript key>
VITE_ENABLE_DEV_LOGIN=false
VITE_ENABLE_QA_LOGIN=false
```

QA 검증 시간에만 `VITE_ENABLE_QA_LOGIN=true`를 사용할 수 있습니다.
이 경우에도 기본 공개 루트(`/`)에는 QA 버튼이 노출되지 않아야 하며,
QA 담당자는 `https://www.clueroom.xyz/?qaLogin=1` 또는 `#qa-login`으로 명시 진입합니다.
공개 운영 트래픽 전에는 백엔드 `AUTH_DEV_LOGIN_ENABLED=false`와 웹 `VITE_ENABLE_QA_LOGIN=false`를 확인합니다.

## Backend Compatibility Gate

- `GET /actuator/health` returns 200 from `https://api.clueroom.xyz`.
- `https://www.clueroom.xyz` origin is allowed by backend CORS.
- Google login uses `POST /api/auth/oauth`.
- Kakao login uses `POST /api/auth/oauth/kakao/code`.
- Refresh uses HttpOnly cookie with `credentials: "include"`; refresh token is not kept in localStorage.
- Public production hides dev/QA login paths unless a restricted QA build is intentionally deployed.
- Scenario library/detail loads from production API.
- Starting a scenario creates or recovers an active session.
- Scenario detail mobile 390px start CTA remains clickable.
- Interrogation suggested question chips are prefill-only until the user sends.
- Interrogation response `aiQuota` guidance is shown when the backend returns a non-`NONE` stage.
- Interrogation quota fallback remains readable/actionable even when `aiQuota.message` is absent.
- Final deduction submit waits for `/api/play-sessions/{sessionId}/result` or shows retry state.
- Bookmarks and reviews use server APIs.
- Bookmark add/remove survives refresh and updates the saved-cases server list.
- Review rating input is integer 1-5.
- QA login button is hidden on `/` even when the QA build flag is enabled; it only appears on an explicit QA login URL.
- Review POST is visible on scenario detail after append or reload.

## Deploy

```bash
cd /c/java/assignment/spring/clueroom-web-fe
bash scripts/deploy-web.sh
```

The deploy script:

1. Rejects dirty or untracked local files.
2. Fetches and fast-forwards the tracking branch.
3. Runs clean dependency install, lint, and build.
4. Uploads `dist/` as a versioned release bundle.
5. Switches `/opt/clueroom/web/current`.
6. Reloads Nginx after syntax validation.
7. Verifies `https://www.clueroom.xyz`.

## Smoke Test

After deploy:

- Open `https://www.clueroom.xyz`.
- Login with Google or Kakao.
- Open scenario library and detail.
- Start or recover a play session.
- Send one interrogation question.
- Confirm no refresh token is stored in browser localStorage.
- Toggle bookmark, refresh, and confirm saved-cases server list state.
- Create an integer review and confirm detail-screen visibility after append or reload.
- Check direct question and evidence-presented question paths in interrogation.
- Check final deduction validation before any approved submit.
- Submit final deduction only in QA-approved test sessions.

## Artifact Boundary

- This repository produces static web assets under `dist/`.
- Standalone Android APK/AAB is managed in the Flutter app repository.
- External miniapp SDK/package artifacts are not produced from this repository.
