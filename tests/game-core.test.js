import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_CONFIG,
  beginAim,
  createGameState,
  releaseAim,
  stepGame,
  updateAim
} from "../src/game-core.js";

test("drag direction becomes throw direction", () => {
  const state = createGameState();

  beginAim(state, 100, 100, 7);
  updateAim(state, 220, 40, 7);
  const released = releaseAim(state, 7);

  assert.equal(released, true);
  assert.equal(state.mode, "flying");
  assert.ok(state.spear.vx > 0);
  assert.ok(state.spear.vy < 0);
});

test("drag distance controls throw power within configured bounds", () => {
  const weak = createGameState();
  beginAim(weak, 0, 0, 1);
  updateAim(weak, 40, 0, 1);
  releaseAim(weak, 1);

  const strong = createGameState();
  beginAim(strong, 0, 0, 1);
  updateAim(strong, GAME_CONFIG.maxAimDistance * 2, 0, 1);
  releaseAim(strong, 1);

  const weakSpeed = Math.hypot(weak.spear.vx, weak.spear.vy);
  const strongSpeed = Math.hypot(strong.spear.vx, strong.spear.vy);

  assert.ok(strongSpeed > weakSpeed);
  assert.ok(strongSpeed <= GAME_CONFIG.maxThrowSpeed + 0.001);
  assert.ok(weakSpeed >= GAME_CONFIG.minThrowSpeed);
});

test("pressing during flight relocates the character to the spear and starts aiming", () => {
  const state = createGameState();

  beginAim(state, 0, 0, 3);
  updateAim(state, 180, -80, 3);
  releaseAim(state, 3);
  stepGame(state, 0.2);

  const spearX = state.spear.x;
  const spearY = state.spear.y;

  const result = beginAim(state, 60, 70, 4);

  assert.equal(result.teleported, true);
  assert.equal(state.mode, "aiming");
  assert.equal(state.player.x, spearX);
  assert.equal(state.player.y, spearY);
  assert.equal(state.spear.vx, 0);
  assert.equal(state.spear.vy, 0);
});

test("flight simulation applies gravity and advances the camera toward the spear", () => {
  const state = createGameState();

  beginAim(state, 0, 0, 9);
  updateAim(state, 200, -100, 9);
  releaseAim(state, 9);

  const initialVy = state.spear.vy;
  const initialCameraX = state.camera.x;
  stepGame(state, 0.03);

  assert.ok(state.spear.vy > initialVy);
  assert.notEqual(state.camera.x, initialCameraX);
  assert.ok(state.spear.travel > 0);
});

test("a short tap still throws using the previous aim instead of producing zero velocity", () => {
  const state = createGameState();

  beginAim(state, 40, 40, 2);
  releaseAim(state, 2);

  assert.equal(state.mode, "flying");
  assert.ok(Math.hypot(state.spear.vx, state.spear.vy) >= GAME_CONFIG.minThrowSpeed);
});
