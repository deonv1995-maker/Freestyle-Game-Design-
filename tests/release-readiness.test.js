import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Android release targets the current Google Play API level", async () => {
  const [appGradle, rootGradle, workflow] = await Promise.all([
    readFile(new URL("../android/app/build.gradle", import.meta.url), "utf8"),
    readFile(new URL("../android/build.gradle", import.meta.url), "utf8"),
    readFile(
      new URL("../.github/workflows/build-android-apk.yml", import.meta.url),
      "utf8"
    )
  ]);

  assert.match(appGradle, /compileSdk\s+36/);
  assert.match(appGradle, /targetSdk\s+36/);
  assert.match(rootGradle, /com\.android\.application' version '8\.13\./);
  assert.match(workflow, /platforms;android-36/);
  assert.match(workflow, /:app:bundleRelease/);
  assert.match(workflow, /Energy-Relay-release\.aab/);
  assert.match(workflow, /base\/assets\/index\.html/);
  assert.match(workflow, /OnBackInvoked\|WindowInsetsController/);
});

test("Android release keeps gameplay local and uses a conservative launch shell", async () => {
  const [manifest, activity] = await Promise.all([
    readFile(
      new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL(
        "../android/app/src/main/java/com/freestylegamedesign/spearrelay/MainActivity.java",
        import.meta.url
      ),
      "utf8"
    )
  ]);

  assert.doesNotMatch(manifest, /android\.permission\.INTERNET/);
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  assert.match(manifest, /android:appCategory="game"/);
  assert.doesNotMatch(manifest, /enableOnBackInvokedCallback/);
  assert.doesNotMatch(activity, /android\.window\./);
  assert.doesNotMatch(activity, /WindowInsetsController/);
  assert.doesNotMatch(activity, /WindowInsets\.Type/);
  assert.doesNotMatch(activity, /Build\.VERSION/);
  assert.match(activity, /SYSTEM_UI_FLAG_IMMERSIVE_STICKY/);
  assert.match(activity, /setAllowFileAccess\(false\)/);
  assert.match(activity, /setAllowContentAccess\(false\)/);
});

test("Android startup has a native recovery path if WebView initialization fails", async () => {
  const activity = await readFile(
    new URL(
      "../android/app/src/main/java/com/freestylegamedesign/spearrelay/MainActivity.java",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(activity, /catch \(RuntimeException \| LinkageError startupError\)/);
  assert.match(activity, /showStartupFallback\(startupError\)/);
  assert.match(activity, /Energy Relay couldn’t start/);
  assert.match(activity, /Android System WebView/);
});
