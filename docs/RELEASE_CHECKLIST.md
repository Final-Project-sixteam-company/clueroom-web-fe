# ClueRoom Release Checklist

Last updated: 2026-06-16

## Artifact Split

Apps in Toss and Google Play use different release artifacts.

- Apps in Toss: upload `clueroom-toss-miniapp.ait` from this repository.
- Google Play: upload a signed Android App Bundle (`.aab`) from the Flutter/Android app repository.
- Do not rename `.ait` to `.aab`; they are different package formats.
- Do not upload Flutter APK/AAB build outputs to Apps in Toss.

## Apps in Toss

Build:

```bash
npm install
npm run lint
npm run build
```

Output:

```text
clueroom-toss-miniapp.ait
```

Console checklist:

- Register the app in the Apps in Toss console.
- Use app type `game`.
- Keep `appName` aligned with `granite.config.ts`.
- Upload app logo and thumbnail assets that match the console guide.
- Fill customer support email/contact.
- Confirm business/representative permissions if Toss login is used.
- Submit app information for review before release.
- Upload the generated `.ait` in the release screen.
- After backend `/api/auth/toss` is live, run sandbox/device login E2E before release review.

Game rating checklist:

- Prepare the game rating/evidence material required by the Apps in Toss game release guide.
- If using a Google Play listing as rating evidence, the Play Store page and game rating details must match the Apps in Toss app.
- Capture real gameplay screens from the Apps in Toss build, not edited mockups.

Official references:

- Apps in Toss app registration: https://developers-apps-in-toss.toss.im/prepare/console-workspace.html
- Apps in Toss game release guide: https://developers-apps-in-toss.toss.im/checklist/app-game.html

## Google Play

Google Play is for the standalone Android app, not this Apps in Toss miniapp.

Build source:

```text
C:\java\assignment\spring\start-up-fe
```

Expected artifact:

```text
build/app/outputs/bundle/release/*.aab
```

Play Console checklist:

- Enroll in Play App Signing for a new app.
- Build a signed release `.aab`.
- Increase Android version code for every update.
- Upload the `.aab` to an internal testing track first.
- Complete store listing, privacy policy, data safety, app access, content rating, target audience, and ads declarations.
- Use internal testing before production rollout.

Official references:

- Upload an app bundle to Play Console: https://developer.android.com/studio/publish/upload-bundle
- Android App Bundle FAQ: https://developer.android.com/guide/app-bundle/faq
- Play Console app setup: https://support.google.com/googleplay/android-developer/answer/9859152

## Backend Release Gate

Do not submit this miniapp for release review until these checks pass:

- `POST /api/auth/toss` returns ClueRoom access/refresh tokens.
- `/api/auth/me` works with Toss-issued ClueRoom JWT.
- Startup refresh works after closing and reopening the Toss WebView.
- Scenario library loads from production API.
- Starting a scenario creates or recovers an active session.
- Interrogation suggested questions are prefill-only until the user taps send.
- Final deduction submit and result polling work on production API.
