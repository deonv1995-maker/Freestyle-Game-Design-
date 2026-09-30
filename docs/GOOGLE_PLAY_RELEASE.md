# Google Play Release Readiness

Last reviewed: 2026-09-30

Energy Relay is being prepared as a mobile-first Android game while keeping the browser game in `src/` as the single gameplay implementation.

## Current Android release baseline

- App name: **Energy Relay**
- Package ID: `com.freestylegamedesign.spearrelay`
- Minimum Android: API 26
- Compile SDK: API 36
- Target SDK: API 36
- Java: 17
- Release format: Android App Bundle (`.aab`)
- Phone-test format: installable debug APK
- Release version name: read from the root `package.json`
- Version code: GitHub Actions run number in CI
- Play upload signing: optional secure environment configuration; no production signing key is stored in the repository

The Android wrapper intentionally keeps its launch path compatible with the minimum supported API. Newer predictive-back and edge-to-edge framework types are not referenced by the launch activity. Fullscreen presentation currently uses the older system-UI flags because launch reliability takes priority over newer navigation polish.

If Android cannot initialize the system WebView provider, Energy Relay must remain open on a native recovery screen rather than immediately terminating. The recovery screen directs the tester to update Chrome and Android System WebView before retrying.

The package ID is a technical identity and does not need to match the public game name. However, Google Play treats it as permanent after publication. If the package should be renamed to `com.freestylegamedesign.energyrelay`, do that before the first Play Console release.

## GitHub release-signing secrets

The Android workflow can sign the release app bundle when these repository secrets are configured:

- `ANDROID_UPLOAD_KEYSTORE_BASE64` — base64-encoded upload keystore
- `ANDROID_UPLOAD_STORE_PASSWORD`
- `ANDROID_UPLOAD_KEY_ALIAS`
- `ANDROID_UPLOAD_KEY_PASSWORD`

Without those secrets, CI still builds and structurally validates the release bundle, but the bundle is not ready to upload to Play Console.

Do not reuse `android/keys/spear-relay-test.jks` for Google Play. It is deliberately a repository-owned test key and is not a private production/upload identity.

## Play Console checklist

Before production submission:

1. Create the Energy Relay app entry in Play Console and confirm the final package ID.
2. Use Play App Signing and create a private upload key.
3. Configure the four GitHub secrets above, run the Android workflow, and download the signed `Energy-Relay-release.aab` artifact.
4. Set the privacy policy URL to the deployed `privacy.html` page and verify the same policy is reachable from the app start screen.
5. Complete Data safety accurately. The current build has no accounts, ads, analytics SDKs, internet permission, cloud saves, location, contacts, camera, microphone, or external tracking.
6. Declare ads as **No** unless an advertising system is added later.
7. Complete app access, target audience, content rating, and the remaining App content declarations.
8. Use `docs/GOOGLE_PLAY_STORE_LISTING.md` for the release copy and asset brief, then prepare the final 512×512 Play icon, 1024×500 feature graphic, and phone screenshots from the release build.
9. Upload first to Internal testing, install the Play-delivered build on a physical phone, and review the automated pre-launch report before promoting the release. If this is a personal developer account created after 13 November 2023, check whether the current 12-testers-for-14-days closed-test requirement applies before production access.
10. Do not move to production while there is a known gameplay blocker, crash, startup failure, or platform-collision trap.

## Physical-device release gate

A candidate is ready to promote only after all of the following pass on the actual Android build:

- Cold launch reaches the Energy Relay start screen.
- If WebView initialization fails, the native recovery screen remains visible instead of the app terminating.
- Play → tutorial → Start Run works without a reload.
- Touch aim, slow motion and mid-air redirect remain responsive.
- The orb cannot become embedded in moving platforms.
- Lasers and drones remain readable and fair at the opening difficulty.
- Seven-life reset and checkpoint respawn work.
- Background/foreground resume does not corrupt the run.
- Screen layout remains readable around cutouts/system gesture areas.
- At least one ten-minute run completes without a crash, stuck state, or obvious performance degradation.
- The privacy page opens and Back returns to the game.

## Release discipline

Keep `main` playable. Publishing changes should be validated through a pull request and merged only after the verification and Android build workflows succeed.
