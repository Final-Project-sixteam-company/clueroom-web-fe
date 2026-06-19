# ClueRoom Web Release Checklist

Last updated: 2026-06-19

이 문서는 `https://www.clueroom.xyz` 일반 웹 배포 기준 체크리스트다.
외부 SDK/패키징 경로는 폐기되었고, standalone Android 앱 배포는 `start-up-fe`에서 별도로 관리한다.

## Local Build Gate

```bash
npm ci
npm run lint
npm run build
```

## Environment

`.env.production` 또는 shell env에 아래 값이 들어 있어야 한다.

```bash
VITE_API_BASE_URL=https://api.clueroom.xyz
VITE_GOOGLE_CLIENT_ID=<Google Web OAuth client id>
VITE_GOOGLE_SERVER_CLIENT_ID=<optional alias for Google Web OAuth client id>
VITE_KAKAO_JAVASCRIPT_KEY=<Kakao JavaScript key>
VITE_ENABLE_DEV_LOGIN=false
VITE_ENABLE_QA_LOGIN=false
VITE_QA_LOGIN_EMAIL=
VITE_QA_LOGIN_NICKNAME=ClueRoom QA
```

QA 버튼은 운영자 승인된 검증 시간에만 켠다.
공개 운영 배포에서는 `VITE_ENABLE_QA_LOGIN=false`가 기본이다.

## Backend Release Gate

- `https://api.clueroom.xyz/actuator/health`가 200을 반환한다.
- `CORS_ALLOWED_ORIGIN_PATTERNS`에 `https://clueroom.xyz`, `https://www.clueroom.xyz`가 포함된다.
- Google Web client id가 백엔드 `GOOGLE_CLIENT_IDS`에 포함된다.
- Kakao REST API key와 app id가 백엔드 env에 설정된다.
- `/api/auth/oauth`, `/api/auth/oauth/kakao/code`, `/api/auth/refresh`, `/api/auth/me`가 최신 배포에 포함된다.
- refresh token은 HttpOnly cookie로 발급되고 웹 localStorage에는 저장하지 않는다.

## Deploy

로컬 Git Bash에서 실행한다.

```bash
bash scripts/deploy-web.sh
```

스크립트는 로컬 변경이 남아 있으면 중단하고, upstream 최신 상태로 fast-forward한 뒤 lint/build/upload/nginx reload를 수행한다.

## Smoke Test

- `https://www.clueroom.xyz` 접속 200
- Google 로그인
- Kakao 로그인
- QA 승인 시 QA 로그인
- 시나리오 목록/상세
- 수사 시작 또는 active session recovery
- 증거/인물/타임라인 조회
- 심문 1회
- 최종 추리 제출 후 result 조회
- 북마크/리뷰 서버 연동
- `/api/auth/refresh` cookie 기반 재발급
- 로그아웃 후 `/api/auth/me`가 인증 실패

## Rollback

prod 서버에서 이전 release symlink로 되돌린 뒤 Nginx를 reload한다.

```bash
ls -lt /opt/clueroom/web/releases
sudo ln -sfn /opt/clueroom/web/releases/<previous-release> /opt/clueroom/web/current
sudo nginx -t
sudo systemctl reload nginx
```
