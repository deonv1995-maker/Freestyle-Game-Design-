import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("start screen and tutorial gate the playable run", async () => {
  const [html, game, css] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/game.js", import.meta.url), "utf8"),
    readFile(new URL("../src/style.css", import.meta.url), "utf8")
  ]);

  for (const id of ["startScreen", "playButton", "tutorialScreen", "startRunButton"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }

  assert.match(game, /MENU:\s*"menu"/);
  assert.match(game, /TUTORIAL:\s*"tutorial"/);
  assert.match(game, /PLAYING:\s*"playing"/);
  assert.match(game, /if \(appPhase === APP_PHASE\.PLAYING\) \{\s*stepGame/);
  assert.match(game, /if \(appPhase !== APP_PHASE\.PLAYING\) return;/);
  assert.match(game, /playButton\.addEventListener\("click"/);
  assert.match(game, /startRunButton\.addEventListener\("click"/);

  assert.match(css, /\.screen-layer/);
  assert.match(css, /\.screen-layer\.is-hidden/);
  assert.match(css, /\.tutorial-step/);
});


test("gameplay HUD uses authoritative orb lives instead of the old info block", async () => {
  const [html, game, css] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/game.js", import.meta.url), "utf8"),
    readFile(new URL("../src/style.css", import.meta.url), "utf8")
  ]);

  assert.match(html, /id=["']lifeOrbs["']/);
  assert.doesNotMatch(html, /class=["']hud-copy["']/);
  assert.doesNotMatch(html, /id=["']status["']/);
  assert.doesNotMatch(html, /id=["']hint["']/);

  assert.match(game, /const orbCount = GAME_CONFIG\.startingLives/);
  assert.match(game, /Array\.from\(\{ length: orbCount \}/);
  assert.match(game, /triggerLifeLoss\(runRestarted\)/);
  assert.match(game, /state\.run\.restartCount !== lastRestartCount/);
  assert.match(game, /restartAfterExplosion/);

  assert.match(css, /\.life-orbs/);
  assert.match(css, /\.life-orb\.is-exploding/);
  assert.match(css, /@keyframes life-orb-explode/);
  assert.match(css, /\.life-orb\.is-spent/);
});


test("release shell exposes the bundled privacy policy", async () => {
  const [html, privacy, build] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../privacy.html", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8")
  ]);

  assert.match(html, /href=["']\.\/privacy\.html["']/);
  assert.match(privacy, /<h1>Privacy Policy<\/h1>/);
  assert.match(privacy, /does not collect, transmit, sell, or\s+share personal information/i);
  assert.match(build, /privacy\.html/);
});
