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
VITE_ENABLE_DEV_LOGIN=false
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

QA나 staging에서만 개발 로그인을 켤 수 있습니다.

```bash
VITE_ENABLE_DEV_LOGIN=true
```

개발 로그인은 백엔드 `AUTH_DEV_LOGIN_ENABLED=true`가 켜져 있어야 동작합니다. 운영 공개 배포에서는 끄는 것을 기본으로 합니다.

## Build Output

```bash
npm run build
```

정적 웹 산출물은 `dist/`에 생성됩니다. Vercel, Netlify, S3/CloudFront, Nginx 같은 정적 호스팅에 배포할 수 있습니다.

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
- 내 정보/기록/북마크/리뷰 로컬 저장

제외한 것:

- Apps in Toss `.ait` 빌드
- Toss `appLogin()`
- Android APK/AAB
- FCM
