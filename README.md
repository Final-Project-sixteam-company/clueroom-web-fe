# ClueRoom Web

ClueRoom을 일반 브라우저에서 실행하는 React/Vite 웹 앱입니다.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Environment

기본 API 서버는 운영 API입니다.

```bash
VITE_API_BASE_URL=https://api.clueroom.xyz
VITE_GOOGLE_CLIENT_ID=<Google Web OAuth client id>
VITE_KAKAO_JAVASCRIPT_KEY=<Kakao JavaScript key>
VITE_ENABLE_DEV_LOGIN=false
VITE_ENABLE_QA_LOGIN=false
VITE_QA_LOGIN_EMAIL=
VITE_QA_LOGIN_NICKNAME=ClueRoom QA
```

Google 로그인은 Google Identity Services가 반환한 ID token을 기존 백엔드 OAuth endpoint로 전달합니다.

```http
POST /api/auth/oauth
```

```json
{
  "provider": "GOOGLE",
  "idToken": "<Google ID token>",
  "deviceId": "<browser installation id>"
}
```

Kakao 로그인은 Kakao JavaScript SDK v2의 authorization code flow를 사용합니다.
프론트는 `Kakao.Auth.authorize()`로 받은 code를 백엔드에 전달하고, 백엔드가 Kakao token exchange와 user info 조회를 수행합니다.

```http
POST /api/auth/oauth/kakao/code
```

```json
{
  "authorizationCode": "<Kakao authorization code>",
  "redirectUri": "https://www.clueroom.xyz",
  "deviceId": "<browser installation id>"
}
```

백엔드는 Kakao REST API 키로 access token을 교환한 뒤 access token info의 `app_id`를 서버 환경변수 `KAKAO_APP_ID`와 대조합니다.

QA나 staging에서만 개발 로그인을 켤 수 있습니다.

```bash
VITE_ENABLE_DEV_LOGIN=true
```

개발 로그인은 백엔드 `AUTH_DEV_LOGIN_ENABLED=true`가 켜져 있어야 동작합니다. 운영 공개 배포에서는 끄는 것을 기본으로 합니다.

QA 전용 로그인은 QA 계정 이메일 입력칸을 통해 `/api/auth/dev`를 호출합니다.
웹 빌드에는 아래 env가 필요하고, 백엔드도 동일하게 `AUTH_DEV_LOGIN_ENABLED=true`가 켜져 있어야 합니다.
공개 운영 배포에서는 QA 검증 시간에만 켜고, 검증이 끝나면 다시 끄는 것을 기본으로 합니다.

```bash
VITE_ENABLE_QA_LOGIN=true
VITE_QA_LOGIN_EMAIL=<optional prefill email>
VITE_QA_LOGIN_NICKNAME=ClueRoom QA
```

`VITE_QA_LOGIN_EMAIL`은 입력칸 기본값으로만 사용됩니다. 값을 비워도 QA 로그인 입력칸은 표시됩니다.

## Build Output

```bash
npm run build
```

정적 웹 산출물은 `dist/`에 생성됩니다. Vercel, Netlify, S3/CloudFront, Nginx 같은 정적 호스팅에 배포할 수 있습니다.

## Production Deploy

현재 운영 배포는 로컬 checkout을 remote 최신 상태로 fast-forward한 뒤, 정적 파일을 빌드해서 prod 서버의 Nginx web root를 교체하는 방식입니다.

실행 위치:

```text
로컬 PC Git Bash
C:\java\assignment\spring\clueroom-toss-miniapp
```

사전 조건:

```text
ssh alias `clueroom`이 prod 서버를 가리켜야 한다.
prod 서버에 `/opt/clueroom/web/current`를 서빙하는 Nginx 설정이 있어야 한다.
웹 로그인을 쓰려면 `.env.production` 또는 shell env에 `VITE_GOOGLE_CLIENT_ID` / `VITE_KAKAO_JAVASCRIPT_KEY` 중 하나 이상이 있어야 한다.
배포 브랜치에 upstream tracking branch가 있어야 한다. 보통 `main -> origin/main`이다.
```

배포:

```bash
cp .env.example .env.production
# .env.production의 VITE_GOOGLE_CLIENT_ID / VITE_KAKAO_JAVASCRIPT_KEY 확인

bash scripts/deploy-web.sh
```

스크립트가 수행하는 일:

```text
1. 로컬 변경이 남아 있으면 중단
2. git fetch --prune
3. upstream branch 기준 fast-forward pull
4. npm ci
5. npm run lint
6. npm run build
7. dist 압축 후 prod 서버 업로드
8. /opt/clueroom/web/current를 새 release로 교체
9. nginx -t && nginx reload
10. PUBLIC_URL 응답 확인
```

로컬 변경을 의도적으로 바로 배포해야 하는 긴급 상황에서만 git update check를 건너뛸 수 있습니다.

```bash
SKIP_GIT_UPDATE=1 bash scripts/deploy-web.sh
```

기본값:

```bash
SSH_TARGET=clueroom
REMOTE_WEB_ROOT=/opt/clueroom/web
PUBLIC_URL=https://www.clueroom.xyz
VITE_API_BASE_URL=https://api.clueroom.xyz
VITE_ENABLE_DEV_LOGIN=false
VITE_ENABLE_QA_LOGIN=false
```

다른 서버나 URL로 배포할 때는 환경 변수로 바꿀 수 있습니다.

```bash
SSH_TARGET=clueroom-staging PUBLIC_URL=https://staging.example.com bash scripts/deploy-web.sh
```

## Web/App Compatibility Notes

- 로그인은 Google/Kakao OAuth와 QA 입력 로그인이 모두 기존 백엔드 JWT 응답을 사용합니다.
- 북마크와 리뷰 작성/조회는 서버 API를 사용하므로 같은 계정 기준으로 앱/웹 간 상태를 공유합니다.
- 리뷰 별점은 백엔드 계약에 맞춰 1~5 정수 단위로 입력합니다.
- 수사 기록은 현재 웹 브라우저 localStorage에만 저장됩니다. 앱/다른 기기와 동기화되는 계정 기록이 아닙니다.
- 최종 추리는 제출 후 `/api/play-sessions/{sessionId}/result` 조회가 성공해야 결과 화면으로 이동합니다. 결과 조회가 일시 실패하면 제출 응답만으로 빈약한 결과 화면을 만들지 않고 재조회 버튼을 표시합니다.

## Scope

구현된 화면:

- 로그인
- 홈
- 시나리오 라이브러리
- 수사 세션
- 증거/인물/타임라인
- 심문 채팅
- 최종 추리 제출
- 결과
- 내 정보/이 기기 기록
- 서버 연동 북마크/리뷰

제외한 것:

- Apps in Toss `.ait` 빌드
- Toss `appLogin()`
- Android APK/AAB
- FCM
