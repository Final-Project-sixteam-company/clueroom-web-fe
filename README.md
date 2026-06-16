# ClueRoom Apps in Toss Miniapp

ClueRoom Flutter 앱을 앱인토스 Web 미니앱으로 재구현하는 프로젝트입니다.

기존 Flutter 코드는 복사하지 않고, 앱인토스 `.ait` 빌드에 필요한 React/Vite 소스와 ClueRoom API 연동만 유지합니다.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

`npm run build`가 성공하면 프로젝트 루트에 `clueroom-toss-miniapp.ait`가 생성됩니다.

## Environment

기본 API 서버는 운영 API입니다.

```bash
VITE_API_BASE_URL=https://api.clueroom.xyz
VITE_TOSS_AUTH_PATH=/api/auth/toss
VITE_ENABLE_DEV_LOGIN=false
```

현재 백엔드에는 Google/Kakao OAuth가 붙어 있고, 앱인토스 토스 로그인용 authorizationCode 교환 endpoint는 별도로 필요합니다. 미니앱은 기본적으로 `POST /api/auth/toss`에 아래 값을 보냅니다.

```json
{
  "authorizationCode": "<appLogin result>",
  "referrer": "<appLogin result>",
  "deviceId": "<Apps in Toss anonymous key or generated id>"
}
```

백엔드가 이 endpoint를 제공하면 기존 ClueRoom access/refresh token 흐름으로 이어집니다.

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

의도적으로 제외한 것:

- Flutter/Android native OAuth SDK
- FCM
- AAB/APK signing 설정
- Flutter build artifact

## Upload

앱인토스 콘솔의 앱 출시 화면에는 `.aab`가 아니라 `clueroom-toss-miniapp.ait`를 업로드합니다.
