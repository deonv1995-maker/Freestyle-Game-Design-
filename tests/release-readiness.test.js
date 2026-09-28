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
});

test("Android release keeps gameplay local and supports modern system navigation", async () => {
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
  assert.match(manifest, /android:enableOnBackInvokedCallback="true"/);
  assert.match(activity, /OnBackInvokedDispatcher/);
  assert.match(activity, /WindowInsetsController/);
  assert.match(activity, /setAllowFileAccess\(false\)/);
  assert.match(activity, /setAllowContentAccess\(false\)/);
});
