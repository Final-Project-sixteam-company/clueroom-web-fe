# ClueRoom Web — Codex Guide

일반 브라우저용 React/Vite 웹 프론트엔드입니다.

## 기준

- 운영 웹 URL: `https://www.clueroom.xyz`
- 운영 API: `https://api.clueroom.xyz`
- Apps in Toss / Toss miniapp 패키징은 폐기되었습니다.
- `/api/auth/toss`, `.ait`, Toss `appLogin()` 경로를 새 기능이나 문서에 추가하지 않습니다.

## 작업 전 확인

- 백엔드 API 계약은 `README.md`와 백엔드 `docs/CaseLab_AI_API_Spec.md`를 우선합니다.
- 인증은 Google/Kakao OAuth + HttpOnly refresh cookie 흐름을 유지합니다.
- QA 로그인은 `VITE_ENABLE_QA_LOGIN=true`일 때만 노출하고, 운영 공개 배포에서는 시간 제한 예외로만 사용합니다.

## 검증

```bash
npm test
npm run lint
npx tsc -b
npm run build
```
