# Android Test Builds

Spear Relay is packaged as an installable Android APK without duplicating gameplay logic.

## Architecture

The browser build remains the source of truth. `npm run build` creates `dist/`, and the Android shell packages that same output as local app assets.

The native layer is intentionally thin:

- one Android Activity;
- one local WebView;
- no remote game URL;
- no duplicated gameplay implementation;
- no runtime framework dependency beyond the Android platform WebView.

Local files are exposed to the WebView under the synthetic HTTPS origin `https://appassets.androidplatform.net/`. This allows the existing JavaScript module imports to behave normally while keeping gameplay content bundled inside the APK.

## Test signing

APK test builds use the repository's dedicated development keystore. It exists only so successive test builds have the same signature and can update an already installed test build.

This key must never be reused for a production/store release.

## Automated build

`.github/workflows/build-android-apk.yml`:

1. runs the existing gameplay tests and static build;
2. builds the Android debug APK;
3. verifies its application ID;
4. uploads the APK as a workflow artifact;
5. publishes the APK in a GitHub Release on `main`.

Package ID: `com.freestylegamedesign.spearrelay`.

Each workflow run uses its run number as the Android `versionCode`, so newer test APKs can install over older ones.

## Phone installation

Download `Spear-Relay.apk` from the latest GitHub Release. Android may ask for permission to install unknown apps for the browser or GitHub app used to download it. This is a sideloaded test build, not a Play Store release.
