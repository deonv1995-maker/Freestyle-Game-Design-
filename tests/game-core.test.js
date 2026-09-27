import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_CONFIG,
  WORLD_SURFACES,
  beginAim,
  createGameState,
  findEarliestSurfaceCollision,
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
  stepGame(state, 0.02);

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


test("world surfaces are unique valid rectangles", () => {
  const ids = new Set();

  for (const surface of WORLD_SURFACES) {
    assert.ok(surface.width > 0);
    assert.ok(surface.height > 0);
    assert.ok(["ground", "platform", "obstacle"].includes(surface.type));
    assert.equal(ids.has(surface.id), false);
    ids.add(surface.id);
  }
});

test("swept collision catches a fast spear crossing an obstacle", () => {
  const hit = findEarliestSurfaceCollision(300, 100, 430, 100);

  assert.ok(hit);
  assert.equal(hit.surface.id, "wall-a");
  assert.equal(hit.x, 340);
  assert.equal(hit.normalX, -1);
});

test("falling spear sticks to the ground instead of passing through it", () => {
  const state = createGameState();
  state.mode = "flying";
  state.spear.x = 0;
  state.spear.y = 120;
  state.spear.vx = 0;
  state.spear.vy = 600;

  for (let i = 0; i < 10 && state.mode === "flying"; i += 1) {
    stepGame(state, 0.05);
  }

  assert.equal(state.mode, "stuck");
  assert.equal(state.spear.y, 180);
  assert.equal(state.spear.contact.surfaceId, "ground");
  assert.equal(state.spear.vx, 0);
  assert.equal(state.spear.vy, 0);
});

test("pressing a stuck spear relays the character to its collision point", () => {
  const state = createGameState();
  state.mode = "stuck";
  state.spear.x = 340;
  state.spear.y = 100;
  state.spear.contact = { surfaceId: "wall-a", normalX: -1, normalY: 0 };

  const result = beginAim(state, 20, 20, 8);

  assert.equal(result.teleported, true);
  assert.equal(state.player.x, 340);
  assert.equal(state.player.y, 100);
  assert.equal(state.mode, "aiming");
});
